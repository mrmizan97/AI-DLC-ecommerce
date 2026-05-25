// Tests for #11 failedPaymentRetry — nudges online pending orders still
// inside the payment session window.

const shared = require("../shared");
const { Order } = require("../../src/model");
const emailService = require("../../src/service/emailService");
const { runFailedPaymentRetry } = require("../../src/lib/jobs/failedPaymentRetry");

describe("#11 failed-payment-retry", () => {
  const ids = [];

  beforeAll(async () => {
    // In window (10 min ago) — should nudge
    const inWin = await Order.create({
      order_number: "PAY001",
      user_id: shared.customerId,
      status: "pending",
      payment_method: "online",
      payment_status: "pending",
      total_amount: 100,
      shipping_address: "addr",
      phone: "01700000000",
      created_at: new Date(Date.now() - 10 * 60 * 1000),
    }, { silent: true });
    ids.push(inWin.id);

    // Out of window (2h ago) — should NOT nudge
    const outWin = await Order.create({
      order_number: "PAY002",
      user_id: shared.customerId,
      status: "pending",
      payment_method: "online",
      payment_status: "pending",
      total_amount: 200,
      shipping_address: "addr",
      phone: "01700000000",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    }, { silent: true });
    ids.push(outWin.id);

    // Already paid — should NOT nudge
    const paid = await Order.create({
      order_number: "PAY003",
      user_id: shared.customerId,
      status: "confirmed",
      payment_method: "online",
      payment_status: "paid",
      total_amount: 50,
      shipping_address: "addr",
      phone: "01700000000",
      created_at: new Date(Date.now() - 5 * 60 * 1000),
    }, { silent: true });
    ids.push(paid.id);
  });

  afterAll(async () => {
    await Order.destroy({ where: { id: ids } });
  });

  test("emails only orders still in the payment window", async () => {
    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true });
    const r = await runFailedPaymentRetry({ windowMinutes: 30 });
    expect(r.ordersInWindow).toBe(1);
    expect(r.nudged).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
