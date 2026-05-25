// A4 — ai-customer-support-rag.
//
// What it does:
//   1. Retrieve: embed the user's question, find topK products by cosine
//      similarity to ProductEmbedding rows. If the user is logged in, also
//      pull their recent orders.
//   2. Build a numbered context (so the model can cite by [n]).
//   3. Generate: send context + question to the LLM with a system prompt
//      that REQUIRES inline citations like [1], [2].
//   4. Return: answer + the sources list so the UI can render clickable
//      footnotes.
//
// Why this is the AI engineer move (not just "call an LLM"):
//   - Grounding: the model only answers from retrieved context; if no
//     context is relevant it says so. No hallucinated SKUs.
//   - Citations: every claim is tied to a source row → user trust + debug.
//   - Tools without tool-use APIs: the order lookup is a simple SQL query
//     we run BEFORE the model call (this is "function calling for free").
//   - Confidence gating: low retrieval score = surface a "talk to a human"
//     handoff hint, not a fake confident answer.

const { Op } = require("sequelize");
const { Product, Order, OrderItem, ProductEmbedding } = require("../model");
const { embed } = require("../lib/ai/embeddings");
const { topK } = require("../lib/ai/cosine");
const { complete } = require("../lib/ai/anthropic");

const SYSTEM = `You are AI-DLC Shop's customer support assistant.
Rules:
- Answer ONLY from the provided context. If the context doesn't contain the answer, say "I don't have that information — let me get you to a human" and stop.
- Cite every fact inline using bracketed numbers like [1], [2] that match the source index.
- Be concise (2-4 sentences). No marketing copy.
- For order-status questions, use ORDER context. For product questions, use PRODUCT context.`;

const MIN_RETRIEVAL_SCORE = 0.15; // below this we treat retrieval as a miss
const TOP_K_PRODUCTS = 5;
const RECENT_ORDERS = 5;

async function loadProductEmbeddings() {
  const rows = await ProductEmbedding.findAll({
    include: [{ model: Product, as: "product", attributes: ["id", "name", "brand", "description", "price", "stock"], required: true }],
  });
  return rows.map((r) => ({ id: r.product_id, vector: r.vector, meta: r.product }));
}

// Sequelize associations may not include ProductEmbedding→Product by default
// — define lazily here so the import order doesn't matter.
function ensureAssoc() {
  if (ProductEmbedding.associations.product) return;
  ProductEmbedding.belongsTo(Product, { foreignKey: "product_id", as: "product" });
}

async function answerSupportQuestion({ question, userId } = {}) {
  if (!question || typeof question !== "string") {
    return { error: "question (string) is required" };
  }

  ensureAssoc();

  // ---------- Retrieve: products by semantic similarity ---------------
  const { vector: queryVec } = await embed(question);
  const allEmbeddings = await loadProductEmbeddings();
  const productHits = topK(queryVec, allEmbeddings, TOP_K_PRODUCTS);
  const goodProductHits = productHits.filter((h) => h.score >= MIN_RETRIEVAL_SCORE);

  // ---------- Retrieve: user's recent orders (only if logged in) ------
  let recentOrders = [];
  if (userId) {
    recentOrders = await Order.findAll({
      where: { user_id: userId },
      include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product", attributes: ["name"] }] }],
      order: [["created_at", "DESC"]],
      limit: RECENT_ORDERS,
    });
  }

  // ---------- Build numbered context ----------------------------------
  const sources = [];
  const lines = [];
  let n = 1;
  for (const h of goodProductHits) {
    sources.push({ index: n, type: "product", id: h.id, name: h.meta?.name, score: h.score });
    lines.push(`[${n}] PRODUCT — id:${h.id} name:"${h.meta?.name}" brand:"${h.meta?.brand || ""}" price:${h.meta?.price} stock:${h.meta?.stock}\ndescription: ${h.meta?.description || ""}`);
    n += 1;
  }
  for (const o of recentOrders) {
    const items = (o.items || []).map((i) => `${i.quantity}× ${i.product?.name || `#${i.product_id}`}`).join(", ");
    sources.push({ index: n, type: "order", id: o.id, orderNumber: o.order_number });
    lines.push(`[${n}] ORDER — number:${o.order_number} status:${o.status} payment:${o.payment_status} total:${o.total_amount} items:${items}`);
    n += 1;
  }

  // ---------- Confidence gate -----------------------------------------
  if (sources.length === 0) {
    return {
      answer: "I don't have that information — let me get you to a human.",
      sources: [],
      handoff: true,
      reason: "no_retrieval",
    };
  }

  // ---------- Generate -------------------------------------------------
  const userPrompt = `Context:\n${lines.join("\n\n")}\n\nUser question: ${question}`;
  const { text, usage } = await complete({
    system: SYSTEM,
    user: userPrompt,
    max_tokens: 400,
    json: false,
  });

  // Detect the handoff sentinel the system prompt instructed the model to
  // use when the context isn't enough.
  const handoff = /i don't have that information/i.test(text);

  return {
    answer: text.trim(),
    sources,
    handoff,
    tokensUsed: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
  };
}

module.exports = { answerSupportQuestion };
