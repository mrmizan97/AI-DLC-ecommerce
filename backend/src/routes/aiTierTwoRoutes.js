// /api/ai-tier2 — endpoints that surface the Tier 2 AI features.
//
//   POST  /enrich/:productId              admin   — kick off A3 enrichment
//   GET   /enrich/:productId              public  — read cached enrichment
//   POST  /embed/:productId               admin   — embed one product (A6)
//   POST  /embed-all                      admin   — batch embed every active product
//   POST  /search                         public  — semantic search (uses A6 output)
//   POST  /support                        public  — RAG-based support chat (A4)
//   GET   /review-summary/:productId      public  — read cached A5 summary
//   POST  /review-summary/:productId      admin   — recompute one product's summary
//
// Long-running ones (enrich, embed-all, recompute summary) are enqueued —
// caller gets a jobId and polls /api/jobs/:id. Sync ones (search, support,
// read cached) return immediately.

const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { enqueue } = require("../lib/queue");
const { Product, ProductEmbedding, ProductEnrichment, ReviewSummary } = require("../model");
const { embed } = require("../lib/ai/embeddings");
const { topK } = require("../lib/ai/cosine");
const { answerSupportQuestion } = require("../service/ragService");

// Lazy auth on req.user so /support can read it when present, but works
// for guests too. Adapted from the existing aiRoutes shape.
function maybeAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  try {
    const jwt = require("jsonwebtoken");
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (_) { /* ignore — treat as guest */ }
  next();
}

// ---------- A3 enrichment ---------------------------------------------------

router.post("/enrich/:productId", authenticate, authorizeAdmin, async (req, res) => {
  const job = await enqueue("ai-product-enrichment", { productId: Number(req.params.productId) });
  res.status(202).json({ jobId: String(job.id) });
});

router.get("/enrich/:productId", async (req, res) => {
  const row = await ProductEnrichment.findOne({ where: { product_id: Number(req.params.productId) } });
  if (!row) return res.status(404).json({ error: "no enrichment cached for this product" });
  res.json(row);
});

// ---------- A6 embeddings ---------------------------------------------------

router.post("/embed/:productId", authenticate, authorizeAdmin, async (req, res) => {
  const job = await enqueue("embed-products", { productId: Number(req.params.productId) });
  res.status(202).json({ jobId: String(job.id) });
});

router.post("/embed-all", authenticate, authorizeAdmin, async (_req, res) => {
  const job = await enqueue("embed-products", { all: true });
  res.status(202).json({ jobId: String(job.id) });
});

// ---------- Semantic search (uses A6 output) -------------------------------

router.post("/search", async (req, res) => {
  const { query, topK: k = 5 } = req.body || {};
  if (!query) return res.status(400).json({ error: "query required" });

  const { vector } = await embed(query);
  const all = await ProductEmbedding.findAll({
    include: [{ model: Product, as: "product", attributes: ["id", "name", "brand", "price", "image_url"] }],
  });
  // Reuse the same association lazily — defensive in case order matters.
  if (!ProductEmbedding.associations.product) {
    ProductEmbedding.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  }
  const items = all.map((r) => ({ id: r.product_id, vector: r.vector, meta: r.product }));
  const hits = topK(vector, items, k);
  res.json({ query, results: hits.map((h) => ({ id: h.id, score: h.score, product: h.meta })) });
});

// ---------- A4 RAG support chat --------------------------------------------

router.post("/support", maybeAuth, async (req, res) => {
  const { question } = req.body || {};
  const userId = req.user?.id;
  const result = await answerSupportQuestion({ question, userId });
  res.json(result);
});

// ---------- A5 review summary ----------------------------------------------

router.get("/review-summary/:productId", async (req, res) => {
  const row = await ReviewSummary.findOne({ where: { product_id: Number(req.params.productId) } });
  if (!row) return res.status(404).json({ error: "no summary cached for this product" });
  res.json(row);
});

router.post("/review-summary/:productId", authenticate, authorizeAdmin, async (req, res) => {
  const job = await enqueue("ai-review-summary", { productId: Number(req.params.productId) });
  res.status(202).json({ jobId: String(job.id) });
});

module.exports = router;
