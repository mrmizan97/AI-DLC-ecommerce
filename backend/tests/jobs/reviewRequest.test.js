// Tests for #6 reviewRequest — emails users whose orders were delivered
// exactly `daysAfter` days ago, deduped per user.

const shared = require("../shared");
const { Order, OrderItem } = require("../../src/model");
const emailService = require("../../src/service/emailService");
const { runReviewRequest } = require("../../src/lib/jobs/reviewRequest");

describe("#6 review-request", () => {
  const ids = [];
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    // Two orders for the same user delivered 3 days ago → should email ONCE.
    for (const num of ["REV001", "REV002"]) {
      const o = await Order.create({
        order_number: num,
        user_id: shared.customerId,
        status: "delivered",
        payment_status: "paid",
        payment_method: "cash",
        total_amount: 10,
        shipping_address: "addr",
        phone: "01700000000",
        updated_at: threeDaysAgo,
      }, { silent: true });
      await OrderItem.create({ order_id: o.id, product_id: shared.productId, quantity: 1, price: 10 });
      ids.push(o.id);
    }
  });

  afterAll(async () => {
    await OrderItem.destroy({ where: { order_id: ids } });
    await Order.destroy({ where: { id: ids } });
  });

  test("emails the user exactly once even with multiple orders", async () => {
    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true });
    const r = await runReviewRequest({ daysAfter: 3 });
    expect(r.ordersConsidered).toBeGreaterThanOrEqual(2);
    expect(r.emailsSent).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
