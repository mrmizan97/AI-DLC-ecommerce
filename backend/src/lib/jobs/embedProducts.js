// A6 — embed-products.
//
// What it does (single mode):
//   - Given { productId }, builds the embedding source text (name + brand +
//     description + category), hashes it, and skips work if the existing
//     ProductEmbedding row already has the same source_hash.
//   - Otherwise calls embed(), upserts the ProductEmbedding row.
//
// What it does (batch mode):
//   - Given { all: true }, iterates active products and embeds them with the
//     same idempotency rule.
//
// Why a job:
//   - Embedding API calls cost money + add latency. Doing it inline in the
//     product create endpoint would block the response.
//   - Idempotency via source_hash means a retry never costs twice.
//   - Source change detection means we don't re-embed on cosmetic edits.

const crypto = require("crypto");
const { Op } = require("sequelize");
const { Product, Category, ProductEmbedding } = require("../../model");
const { embed } = require("../ai/embeddings");

function sourceText(p) {
  const parts = [p.name, p.brand, p.description, p.category?.name];
  return parts.filter(Boolean).join(" \n ");
}

function hash(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 32);
}

async function embedOne(productId) {
  const product = await Product.findByPk(productId, {
    include: [{ model: Category, as: "category", attributes: ["name"] }],
  });
  if (!product) return { productId, skipped: "not found" };

  const src = sourceText(product);
  const src_hash = hash(src);

  const existing = await ProductEmbedding.findOne({ where: { product_id: productId } });
  if (existing && existing.source_hash === src_hash) {
    return { productId, skipped: "source unchanged", model: existing.model };
  }

  const { vector, model, dims } = await embed(src);
  if (existing) {
    await existing.update({ vector, model, dims, source_hash: src_hash });
  } else {
    await ProductEmbedding.create({ product_id: productId, vector, model, dims, source_hash: src_hash });
  }
  return { productId, embedded: true, model, dims };
}

async function runEmbedProducts({ productId, all = false } = {}) {
  if (productId) return embedOne(productId);

  if (!all) return { error: "pass { productId } or { all: true }" };

  const products = await Product.findAll({
    where: { status: "active" },
    attributes: ["id"],
  });

  const results = { embedded: 0, skipped: 0, failed: 0, total: products.length };
  for (const p of products) {
    try {
      const r = await embedOne(p.id);
      if (r.embedded) results.embedded += 1;
      else results.skipped += 1;
    } catch (err) {
      console.error(`[embed-products] ${p.id} failed:`, err.message);
      results.failed += 1;
    }
  }
  return results;
}

module.exports = { runEmbedProducts, embedOne, sourceText, hash };
