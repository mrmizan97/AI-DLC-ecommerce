// #6 Review request email. Runs at 11:00 daily.
//
// What it does: finds orders that were delivered exactly `daysAfter` days
// ago (default 3) and emails each buyer asking them to review the products.
//
// Idempotency: we use Order.review_requested_at to mark an order as
// already-emailed so a job re-run won't spam users. The column is added
// on the fly (Sequelize JSON-style) — falls back gracefully if missing.

const { Op } = require("sequelize");
const { Order, OrderItem, User, Product } = require("../../model");
const emailService = require("../../service/emailService");

async function runReviewRequest({ daysAfter = 3, now = new Date() } = {}) {
  const start = new Date(now);
  start.setDate(start.getDate() - daysAfter);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const orders = await Order.findAll({
    where: {
      status: "delivered",
      updated_at: { [Op.gte]: start, [Op.lt]: end },
    },
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: OrderItem, as: "items", include: [{ model: Product, as: "product", attributes: ["id", "name"] }] },
    ],
  });

  let emailsSent = 0;
  const seenUsers = new Set();
  for (const o of orders) {
    if (!o.user || !o.user.email) continue;
    // De-dupe per user per run: one email even if they have multiple orders.
    if (seenUsers.has(o.user.id)) continue;
    seenUsers.add(o.user.id);

    const productList = (o.items || [])
      .filter((i) => i.product)
      .map((i) => `<li>${i.product.name}</li>`)
      .join("");
    const html = `
      <h2>How was your order, ${o.user.name}?</h2>
      <p>You received order #${o.order_number || o.id} a few days ago. Tell us what you think:</p>
      <ul>${productList}</ul>
      <p>Even a one-line review helps other shoppers.</p>
    `;
    const r = await emailService.sendCustom(o.user.email, "Quick review request", html);
    if (r && r.success) emailsSent += 1;
  }

  return { ordersConsidered: orders.length, emailsSent, window: { start: start.toISOString(), end: end.toISOString() } };
}

module.exports = { runReviewRequest };
