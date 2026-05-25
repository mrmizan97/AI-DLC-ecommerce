// Tests for A5 ai-review-summary. LLM mocked — fixture returns one map
// partial then the reduce. Verifies map-reduce flow + cache row.

const shared = require("../shared");
const { Review, ReviewSummary } = require("../../src/model");
const anthropic = require("../../src/lib/ai/anthropic");
const { summarizeOneProduct } = require("../../src/lib/jobs/aiReviewSummary");

describe("A5 ai-review-summary (map-reduce)", () => {
  beforeEach(async () => {
    await ReviewSummary.destroy({ where: {} });
    await Review.destroy({ where: { product_id: shared.productId } });
  });

  test("runs map then reduce, writes a ReviewSummary row", async () => {
    // 3 reviews — fits in one map chunk (chunk size = 25).
    for (const [rating, comment] of [
      [5, "fast shipping and well packed"],
      [2, "scroll wheel feels cheap"],
      [4, "great battery life, ergonomic"],
    ]) {
      await Review.create({ product_id: shared.productId, user_id: shared.customerId + Math.floor(Math.random() * 1000), rating, comment });
    }

    const mapOut = { json: { loves: ["fast shipping", "great battery"], complaints: ["cheap scroll wheel"] }, usage: { input_tokens: 100, output_tokens: 50 }, text: "x" };
    const reduceOut = { json: { loves: ["fast shipping", "great battery"], complaints: ["cheap scroll wheel"], summary: "Reviewers love shipping and battery; complain about scroll wheel feel." }, usage: { input_tokens: 50, output_tokens: 60 }, text: "x" };

    const spy = jest.spyOn(anthropic, "complete")
      .mockResolvedValueOnce(mapOut)
      .mockResolvedValueOnce(reduceOut);

    const r = await summarizeOneProduct(shared.productId);
    expect(r.summarized).toBe(true);
    expect(r.reviewCount).toBe(3);
    expect(spy).toHaveBeenCalledTimes(2); // 1 map + 1 reduce

    const row = await ReviewSummary.findOne({ where: { product_id: shared.productId } });
    expect(row.loves).toEqual(expect.arrayContaining(["fast shipping"]));
    expect(row.complaints).toEqual(expect.arrayContaining(["cheap scroll wheel"]));
    expect(row.summary).toMatch(/scroll wheel/);
    spy.mockRestore();
  });

  test("skips when no reviews in window", async () => {
    const r = await summarizeOneProduct(shared.productId, { windowDays: 1 });
    expect(r.skipped).toBeDefined();
  });
});
