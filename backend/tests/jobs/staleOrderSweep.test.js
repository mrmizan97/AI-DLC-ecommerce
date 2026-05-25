// Tests for #2 staleOrderSweep — verifies pending+unpaid orders older than
// the cutoff get cancelled AND their stock is restored.

const shared = require("../shared");
const { Order, OrderItem, Product } = require("../../src/model");
const { runStaleOrderSweep } = require("../../src/lib/jobs/staleOrderSweep");

describe("#2 stale-order-sweep", () => {
  let staleOrderId;
  let freshOrderId;
  let stockBefore;

  beforeAll(async () => {
    const p = await Product.findByPk(shared.productId);
    stockBefore = p.stock;

    // Stale: created 2h ago, pending+pending. Should be swept.
    const stale = await Order.create({
      order_number: "STALE1",
      user_id: shared.customerId,
      status: "pending",
      payment_status: "pending",
      payment_method: "online",
      total_amount: 29.99,
      shipping_address: "addr",
      phone: "01700000000",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    }, { silent: true });
    await OrderItem.create({ order_id: stale.id, product_id: shared.productId, quantity: 2, price: 29.99 });
    await Product.update({ stock: stockBefore - 2 }, { where: { id: shared.productId } });
    staleOrderId = stale.id;

    // Fresh: 5 min ago — should NOT be swept (default cutoff is 60 min).
    const fresh = await Order.create({
      order_number: "FRESH1",
      user_id: shared.customerId,
      status: "pending",
      payment_status: "pending",
      payment_method: "online",
      total_amount: 59.99,
      shipping_address: "addr",
      phone: "01700000000",
      created_at: new Date(Date.now() - 5 * 60 * 1000),
    }, { silent: true });
    await OrderItem.create({ order_id: fresh.id, product_id: shared.productId, quantity: 1, price: 59.99 });
    freshOrderId = fresh.id;
  });

  afterAll(async () => {
    await OrderItem.destroy({ where: { order_id: [staleOrderId, freshOrderId] } });
    await Order.destroy({ where: { id: [staleOrderId, freshOrderId] } });
    await Product.update({ stock: stockBefore }, { where: { id: shared.productId } });
  });

  test("cancels only stale orders, restores stock", async () => {
    const r = await runStaleOrderSweep({ staleAfterMinutes: 60 });
    expect(r.cancelled).toBe(1);
    expect(r.restoredUnits).toBe(2);

    const stale = await Order.findByPk(staleOrderId);
    expect(stale.status).toBe("cancelled");
    expect(stale.payment_status).toBe("cancelled");

    const fresh = await Order.findByPk(freshOrderId);
    expect(fresh.status).toBe("pending");

    const p = await Product.findByPk(shared.productId);
    expect(p.stock).toBe(stockBefore); // stock restored
  });
});
