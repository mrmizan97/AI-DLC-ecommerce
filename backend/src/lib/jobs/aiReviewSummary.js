// A5 — ai-review-summary.
//
// What it does (map-reduce):
//   1. MAP: for each product with new reviews in the last N days, chunk
//      the reviews into batches and ask the LLM to extract loves +
//      complaints per chunk.
//   2. REDUCE: merge those partials into one final {loves, complaints, summary}
//      and persist to ReviewSummary.
//
// Why map-reduce: a top product can have hundreds of reviews. Stuffing them
// into one prompt is wasteful and risks context-window limits. Mapping in
// chunks parallelises (one prompt per chunk) and the reduce step is small.
//
// Why a job: this is offline analytics, not a per-request operation. Run
// nightly; serve cached results from /api/ai-tier2/review-summary/:id.

const { Op } = require("sequelize");
const { Product, Review, ReviewSummary } = require("../../model");
const { complete, DEFAULT_MODEL } = require("../ai/anthropic");

const CHUNK_SIZE = 25;

const MAP_SYSTEM = `You read a batch of customer reviews and extract themes.
Return ONLY valid JSON:
{
  "loves": ["<short phrase, max 8 words>"],
  "complaints": ["<short phrase, max 8 words>"]
}
No prose.`;

const REDUCE_SYSTEM = `You receive multiple partial extractions of customer review themes (loves and complaints).
Merge them, deduplicate near-duplicates, keep at most 5 in each list, and write a one-paragraph synthesis.
Return ONLY valid JSON:
{
  "loves": ["..."],
  "complaints": ["..."],
  "summary": "one paragraph"
}
No prose.`;

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function reviewText(r) {
  return `★${r.rating} — ${r.comment || ""}`.trim();
}

async function summarizeOneProduct(productId, { windowDays = 30, now = new Date() } = {}) {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const reviews = await Review.findAll({
    where: { product_id: productId, created_at: { [Op.gte]: since } },
    order: [["created_at", "DESC"]],
  });
  if (reviews.length === 0) return { productId, skipped: "no reviews in window" };

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  // MAP
  const batches = chunk(reviews.map(reviewText), CHUNK_SIZE);
  const partials = [];
  let mapTokens = 0;
  for (const batch of batches) {
    const { json, usage } = await complete({
      system: MAP_SYSTEM,
      user: batch.map((t, i) => `[${i + 1}] ${t}`).join("\n"),
      max_tokens: 400,
      json: true,
    });
    if (json) partials.push(json);
    mapTokens += (usage?.input_tokens || 0) + (usage?.output_tokens || 0);
  }

  if (partials.length === 0) {
    return { productId, error: "all map steps failed" };
  }

  // REDUCE
  const reduceInput = partials
    .map((p, i) => `Batch ${i + 1}:\nLOVES: ${(p.loves || []).join("; ")}\nCOMPLAINTS: ${(p.complaints || []).join("; ")}`)
    .join("\n\n");
  const { json: finalJson, usage: redUsage } = await complete({
    system: REDUCE_SYSTEM,
    user: reduceInput,
    max_tokens: 600,
    json: true,
  });
  if (!finalJson) return { productId, error: "reduce step returned invalid JSON" };

  const reduceTokens = (redUsage?.input_tokens || 0) + (redUsage?.output_tokens || 0);
  const payload = {
    product_id: productId,
    window_days: windowDays,
    review_count: reviews.length,
    avg_rating: avg.toFixed(2),
    loves: finalJson.loves || [],
    complaints: finalJson.complaints || [],
    summary: finalJson.summary || null,
    tokens_used: mapTokens + reduceTokens,
    model: DEFAULT_MODEL,
  };
  const existing = await ReviewSummary.findOne({ where: { product_id: productId } });
  const row = existing ? await existing.update(payload) : await ReviewSummary.create(payload);
  return { productId, summarized: true, reviewCount: reviews.length, tokensUsed: payload.tokens_used, row };
}

async function runAiReviewSummary({ productId, windowDays = 30, now } = {}) {
  if (productId) return summarizeOneProduct(productId, { windowDays, now });

  // Default mode: every product that has at least one recent review.
  const since = new Date((now ? new Date(now) : new Date()).getTime() - windowDays * 24 * 60 * 60 * 1000);
  const productIds = await Review.findAll({
    attributes: [[Review.sequelize.fn("DISTINCT", Review.sequelize.col("product_id")), "product_id"]],
    where: { created_at: { [Op.gte]: since } },
    raw: true,
  });
  const result = { processed: 0, skipped: 0, failed: 0, tokensUsed: 0 };
  for (const { product_id } of productIds) {
    try {
      const r = await summarizeOneProduct(product_id, { windowDays, now });
      if (r.summarized) {
        result.processed += 1;
        result.tokensUsed += r.tokensUsed || 0;
      } else {
        result.skipped += 1;
      }
    } catch (err) {
      console.error(`[ai-review-summary] product ${product_id} failed:`, err.message);
      result.failed += 1;
    }
  }
  return result;
}

module.exports = { runAiReviewSummary, summarizeOneProduct };
