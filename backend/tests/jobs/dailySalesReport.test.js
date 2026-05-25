// Tests for #4 dailySalesReport — aggregates yesterday's delivered orders.
// Email sending is mocked so the test doesn't need SMTP.

const shared = require("../shared");
const { Order, OrderItem } = require("../../src/model");
const emailService = require("../../src/service/emailService");
const { runDailySalesReport, buildReport } = require("../../src/lib/jobs/dailySalesReport");

describe("#4 daily-sales-report", () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ids = [];

  beforeAll(async () => {
    // Two delivered orders dated yesterday + one dated today (must be excluded).
    for (const [num, amount, qty, when] of [
      ["RPT001", 100, 2, yesterday],
      ["RPT002", 50, 1, yesterday],
      ["RPT003", 999, 5, new Date()], // today — excluded
    ]) {
      const o = await Order.create({
        order_number: num,
        user_id: shared.customerId,
        status: "delivered",
        payment_status: "paid",
        payment_method: "cash",
        total_amount: amount,
        shipping_address: "addr",
        phone: "01700000000",
        created_at: when,
      }, { silent: true });
      await OrderItem.create({ order_id: o.id, product_id: shared.productId, quantity: qty, price: amount / qty });
      ids.push(o.id);
    }
  });

  afterAll(async () => {
    await OrderItem.destroy({ where: { order_id: ids } });
    await Order.destroy({ where: { id: ids } });
  });

  test("buildReport sums yesterday's delivered orders only", async () => {
    const r = await buildReport();
    expect(r.orderCount).toBe(2);
    expect(r.grossRevenue).toBe(150);
    expect(r.unitsSold).toBe(3);
  });

  test("runDailySalesReport emails every admin", async () => {
    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true, messageId: "x" });
    const r = await runDailySalesReport();
    expect(r.report.orderCount).toBe(2);
    expect(r.adminsTargeted).toBeGreaterThanOrEqual(1);
    expect(r.emailsSent).toBe(r.adminsTargeted);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
