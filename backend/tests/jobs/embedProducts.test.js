// Tests for A6 embed-products. Uses the deterministic fallback embedding
// (no VOYAGE_API_KEY needed), so behaviour is fully reproducible offline.

const shared = require("../shared");
const { Product, ProductEmbedding } = require("../../src/model");
const { runEmbedProducts, embedOne } = require("../../src/lib/jobs/embedProducts");

describe("A6 embed-products", () => {
  beforeEach(async () => {
    await ProductEmbedding.destroy({ where: {} });
  });

  test("embeds a single product and stores a vector", async () => {
    const r = await embedOne(shared.productId);
    expect(r.embedded).toBe(true);
    expect(r.dims).toBeGreaterThan(0);

    const row = await ProductEmbedding.findOne({ where: { product_id: shared.productId } });
    expect(row).not.toBeNull();
    expect(Array.isArray(row.vector)).toBe(true);
    expect(row.vector.length).toBe(row.dims);
  });

  test("re-running with the same product text is a no-op (idempotency)", async () => {
    await embedOne(shared.productId);
    const first = await ProductEmbedding.findOne({ where: { product_id: shared.productId } });

    const r = await embedOne(shared.productId);
    expect(r.skipped).toBe("source unchanged");

    const second = await ProductEmbedding.findOne({ where: { product_id: shared.productId } });
    expect(second.updated_at.getTime()).toBe(first.updated_at.getTime());
  });

  test("re-embeds when the source text changes", async () => {
    await embedOne(shared.productId);
    await Product.update({ description: "completely new copy" }, { where: { id: shared.productId } });

    const r = await embedOne(shared.productId);
    expect(r.embedded).toBe(true);
  });

  test("batch mode embeds every active product", async () => {
    const r = await runEmbedProducts({ all: true });
    expect(r.total).toBeGreaterThanOrEqual(2);
    expect(r.embedded + r.skipped).toBe(r.total);
  });
});
