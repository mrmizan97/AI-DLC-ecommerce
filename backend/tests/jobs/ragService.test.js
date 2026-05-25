// Tests for A4 ai-customer-support-rag. Mocks the LLM but uses real
// embeddings (deterministic fallback) + a real ProductEmbedding row, so
// the retrieval path is exercised end-to-end.

const shared = require("../shared");
const { ProductEmbedding, Order, OrderItem } = require("../../src/model");
const anthropic = require("../../src/lib/ai/anthropic");
const { embedOne } = require("../../src/lib/jobs/embedProducts");
const { answerSupportQuestion } = require("../../src/service/ragService");

describe("A4 ai-customer-support-rag", () => {
  beforeAll(async () => {
    await ProductEmbedding.destroy({ where: {} });
    await embedOne(shared.productId);
    await embedOne(shared.productId2);
  });

  test("retrieves products, generates answer with citations", async () => {
    const spy = jest.spyOn(anthropic, "complete").mockResolvedValue({
      text: "The Wireless Mouse [1] is in stock at $29.99.",
      usage: { input_tokens: 200, output_tokens: 30 },
    });
    const r = await answerSupportQuestion({ question: "Do you sell a wireless mouse?" });
    expect(r.handoff).toBe(false);
    expect(r.sources.length).toBeGreaterThan(0);
    expect(r.sources[0].type).toBe("product");
    expect(r.answer).toMatch(/\[1\]/);
    spy.mockRestore();
  });

  test("handoff when retrieval is empty (no embeddings)", async () => {
    await ProductEmbedding.destroy({ where: {} });
    const spy = jest.spyOn(anthropic, "complete");
    const r = await answerSupportQuestion({ question: "anything" });
    expect(r.handoff).toBe(true);
    expect(r.sources.length).toBe(0);
    expect(spy).not.toHaveBeenCalled(); // we short-circuit before the LLM
    spy.mockRestore();
    // restore embeddings for any later tests
    await embedOne(shared.productId);
  });

  test("includes order context when userId is provided", async () => {
    const order = await Order.create({
      order_number: "RAG001",
      user_id: shared.customerId,
      status: "shipped",
      payment_status: "paid",
      payment_method: "cash",
      total_amount: 29.99,
      shipping_address: "addr", phone: "01700000000",
    });
    await OrderItem.create({ order_id: order.id, product_id: shared.productId, quantity: 1, price: 29.99 });

    const spy = jest.spyOn(anthropic, "complete").mockResolvedValue({
      text: "Your order RAG001 is shipped [2].",
      usage: { input_tokens: 200, output_tokens: 30 },
    });
    const r = await answerSupportQuestion({ question: "Where is my order?", userId: shared.customerId });
    expect(r.sources.some((s) => s.type === "order")).toBe(true);
    spy.mockRestore();

    await OrderItem.destroy({ where: { order_id: order.id } });
    await Order.destroy({ where: { id: order.id } });
  });
});
