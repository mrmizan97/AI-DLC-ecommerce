// A3 — ai-product-enrichment.
//
// What it does:
//   - Given { productId }, generates an SEO description, meta keywords, alt
//     text, and smart tags for that product using Claude Haiku 4.5.
//   - Caches the result in ProductEnrichment, keyed by source_hash so we
//     don't burn tokens on unchanged products.
//
// Why a job:
//   - LLM calls are 1-3s. Doing this inline blocks product CRUD.
//   - Generating once per product (or once per content change) is cheap;
//     calling on every read would be insane.
//   - Retries are safe — same input → cache hit on retry.

const crypto = require("crypto");
const { Product, Category, ProductEnrichment } = require("../../model");
const { complete, DEFAULT_MODEL } = require("../ai/anthropic");

function sourceText(p) {
  return [`name: ${p.name}`, `brand: ${p.brand || "n/a"}`, `category: ${p.category?.name || "n/a"}`, `description: ${p.description || ""}`].join("\n");
}

function hash(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 32);
}

const SYSTEM = `You are an e-commerce copywriter. For each product you receive, return ONLY valid JSON in this exact shape:
{
  "seo_description": "<60-160 char description optimised for search and conversion>",
  "meta_keywords": ["<5-10 keywords>"],
  "alt_text": "<short accessible alt text for the product image, under 120 chars>",
  "smart_tags": ["<3-8 short tags that aid discovery, lowercase>"]
}
Do not include any prose, only the JSON object.`;

async function runAiProductEnrichment({ productId } = {}) {
  if (!productId) return { error: "productId required" };
  const product = await Product.findByPk(productId, {
    include: [{ model: Category, as: "category", attributes: ["name"] }],
  });
  if (!product) return { error: "product not found" };

  const src = sourceText(product);
  const src_hash = hash(src);

  const existing = await ProductEnrichment.findOne({ where: { product_id: productId } });
  if (existing && existing.source_hash === src_hash) {
    return { productId, cached: true, enrichment: existing };
  }

  const { json, usage, text } = await complete({
    system: SYSTEM,
    user: src,
    max_tokens: 600,
    json: true,
  });

  if (!json) {
    // Surface raw text in the error so we can debug bad LLM outputs.
    return { productId, error: "LLM returned invalid JSON", raw: text };
  }

  const tokens_used = (usage?.input_tokens || 0) + (usage?.output_tokens || 0);
  const payload = {
    product_id: productId,
    seo_description: json.seo_description ?? null,
    meta_keywords: json.meta_keywords ?? [],
    alt_text: json.alt_text ?? null,
    smart_tags: json.smart_tags ?? [],
    source_hash: src_hash,
    model: DEFAULT_MODEL,
    tokens_used,
  };
  const row = existing ? await existing.update(payload) : await ProductEnrichment.create(payload);
  return { productId, cached: false, enrichment: row, tokens_used };
}

module.exports = { runAiProductEnrichment };
