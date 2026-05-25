// #11 Failed payment retry. Runs every 5 minutes.
//
// What it does: looks at online orders with payment_status="pending" that
// were created less than `windowMinutes` ago (default 30 — same as the
// SSLCommerz session window). For each, it nudges the user with a follow-up
// email containing the payment link / instructions.
//
// What it does NOT do: actually re-charge the user. We can't initiate a
// charge without the user re-entering details — at best we can remind them.
//
// Why a job: many payment "failures" are network blips, modal closes,
// abandoned tabs. Recovering even a small fraction is meaningful.

const { Op } = require("sequelize");
const { Order, User } = require("../../model");
const emailService = require("../../service/emailService");

async function runFailedPaymentRetry({ windowMinutes = 30, now = new Date() } = {}) {
  const cutoff = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const orders = await Order.findAll({
    where: {
      payment_method: "online",
      payment_status: "pending",
      status: "pending",
      created_at: { [Op.gte]: cutoff }, // inside payment session window
    },
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    limit: 100,
  });

  let nudged = 0;
  for (const o of orders) {
    if (!o.user || !o.user.email) continue;
    const html = `
      <h2>Finish your order, ${o.user.name}</h2>
      <p>We saved your order #${o.order_number || o.id} for $${o.total_amount}.</p>
      <p>Your payment didn't complete — open the link in your account to retry checkout.</p>
    `;
    const r = await emailService.sendCustom(o.user.email, "Complete your payment", html);
    if (r && r.success) nudged += 1;
  }
  return { ordersInWindow: orders.length, nudged, windowMinutes };
}

module.exports = { runFailedPaymentRetry };
