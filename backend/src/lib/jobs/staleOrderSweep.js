// #2 Stale order sweep. Runs every 15 minutes.
//
// What it does:
//   - Finds orders that are status=pending AND payment_status=pending AND
//     older than `staleAfterMinutes` (default 60).
//   - Cancels them (status=cancelled, payment_status=cancelled) and restores
//     the reserved stock for each line item.
//
// Why a job: an unpaid online order sits in "pending" forever, holding
// stock that real buyers can't see. Without sweeping, inventory deadlocks.

const { Op } = require("sequelize");
const { sequelize, Order, OrderItem, Product } = require("../../model");

async function runStaleOrderSweep({ staleAfterMinutes = 60, now = new Date() } = {}) {
  const cutoff = new Date(now.getTime() - staleAfterMinutes * 60 * 1000);

  const stale = await Order.findAll({
    where: {
      status: "pending",
      payment_status: "pending",
      created_at: { [Op.lt]: cutoff },
    },
    include: [{ model: OrderItem, as: "items" }],
    limit: 200, // cap per tick so a backlog doesn't lock the worker
  });

  let cancelled = 0;
  let restoredUnits = 0;

  for (const order of stale) {
    const t = await sequelize.transaction();
    try {
      // Restore stock for every line in the order.
      for (const item of order.items) {
        await Product.update(
          { stock: sequelize.literal(`stock + ${item.quantity}`) },
          { where: { id: item.product_id }, transaction: t }
        );
        restoredUnits += item.quantity;
      }
      await order.update(
        { status: "cancelled", payment_status: "cancelled" },
        { transaction: t }
      );
      await t.commit();
      cancelled += 1;
    } catch (err) {
      await t.rollback();
      // Don't throw — one bad order shouldn't stop the sweep.
      console.error(`[staleOrderSweep] order ${order.id} failed:`, err.message);
    }
  }

  return { cancelled, restoredUnits, considered: stale.length, cutoff: cutoff.toISOString() };
}

module.exports = { runStaleOrderSweep };
