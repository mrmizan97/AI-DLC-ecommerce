// Tests for A3 ai-product-enrichment. Mocks the Anthropic completion so the
// test doesn't need a real ANTHROPIC_API_KEY and is fully deterministic.

const shared = require("../shared");
const { Product, ProductEnrichment } = require("../../src/model");
const anthropic = require("../../src/lib/ai/anthropic");
const { runAiProductEnrichment } = require("../../src/lib/jobs/aiProductEnrichment");

const FAKE_LLM = {
  json: {
    seo_description: "Ergonomic wireless mouse for everyday productivity.",
    meta_keywords: ["wireless mouse", "ergonomic", "logitech"],
    alt_text: "Black wireless ergonomic mouse on a desk",
    smart_tags: ["wireless", "ergonomic", "mouse", "productivity"],
  },
  usage: { input_tokens: 100, output_tokens: 80 },
  text: "ok",
};

describe("A3 ai-product-enrichment", () => {
  beforeEach(async () => {
    await ProductEnrichment.destroy({ where: {} });
  });

  test("generates and caches enrichment", async () => {
    const spy = jest.spyOn(anthropic, "complete").mockResolvedValue(FAKE_LLM);
    const r = await runAiProductEnrichment({ productId: shared.productId });
    expect(r.cached).toBe(false);
    expect(r.enrichment.seo_description).toMatch(/wireless/i);
    expect(r.enrichment.smart_tags).toContain("wireless");
    expect(r.tokens_used).toBe(180);
    expect(spy).toHaveBeenCalledTimes(1);

    // Second call should hit the cache and NOT call the LLM again.
    const r2 = await runAiProductEnrichment({ productId: shared.productId });
    expect(r2.cached).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test("re-runs when the source text changes", async () => {
    const spy = jest.spyOn(anthropic, "complete").mockResolvedValue(FAKE_LLM);
    await runAiProductEnrichment({ productId: shared.productId });
    await Product.update({ description: "totally new copy" }, { where: { id: shared.productId } });

    const r = await runAiProductEnrichment({ productId: shared.productId });
    expect(r.cached).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  test("surfaces parse errors without writing garbage to the cache", async () => {
    const spy = jest.spyOn(anthropic, "complete").mockResolvedValue({
      json: null, usage: { input_tokens: 10, output_tokens: 10 }, text: "definitely not json",
    });
    const r = await runAiProductEnrichment({ productId: shared.productId });
    expect(r.error).toMatch(/invalid JSON/);
    const row = await ProductEnrichment.findOne({ where: { product_id: shared.productId } });
    // No new row should have been created from the bad output.
    expect(row).toBeNull();
    spy.mockRestore();
  });
});
