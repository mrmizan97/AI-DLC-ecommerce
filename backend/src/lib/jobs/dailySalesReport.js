// #4 Daily sales report. Runs at 02:00 daily.
//
// What it does:
//   - Aggregates yesterday's delivered orders into totals (order count,
//     gross revenue, units sold).
//   - Emails the summary to every admin user.
//
// Why a job: someone has to email admins every morning. Doing it inline
// when they hit a dashboard is fine for live data, but a scheduled report
// is the canonical "yesterday's number" that everyone agrees on.

const { Op, fn, col } = require("sequelize");
const { Order, OrderItem, User } = require("../../model");
const emailService = require("../../service/emailService");

function dayWindow(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function buildReport({ for_date } = {}) {
  // Default: yesterday.
  const base = for_date ? new Date(for_date) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { start, end } = dayWindow(base);

  const where = {
    status: "delivered",
    created_at: { [Op.gte]: start, [Op.lt]: end },
  };

  const orders = await Order.findAll({
    where,
    attributes: [
      [fn("COUNT", col("id")), "order_count"],
      [fn("COALESCE", fn("SUM", col("total_amount")), 0), "gross_revenue"],
    ],
    raw: true,
  });

  const units = await OrderItem.findOne({
    attributes: [[fn("COALESCE", fn("SUM", col("quantity")), 0), "units"]],
    include: [{ model: Order, as: "order", where, attributes: [] }],
    raw: true,
  });

  return {
    date: start.toISOString().slice(0, 10),
    orderCount: Number(orders[0]?.order_count || 0),
    grossRevenue: Number(orders[0]?.gross_revenue || 0),
    unitsSold: Number(units?.units || 0),
  };
}

function renderHtml(report) {
  return `
    <h2>Daily sales — ${report.date}</h2>
    <ul>
      <li>Orders delivered: <b>${report.orderCount}</b></li>
      <li>Gross revenue: <b>${report.grossRevenue.toFixed(2)}</b></li>
      <li>Units sold: <b>${report.unitsSold}</b></li>
    </ul>
  `;
}

async function runDailySalesReport({ for_date } = {}) {
  const report = await buildReport({ for_date });
  const admins = await User.findAll({ where: { role: "admin" }, attributes: ["email"] });

  let sent = 0;
  for (const a of admins) {
    const res = await emailService.sendCustom(
      a.email,
      `Daily sales: ${report.date}`,
      renderHtml(report)
    );
    if (res && res.success) sent += 1;
  }

  return { report, adminsTargeted: admins.length, emailsSent: sent };
}

module.exports = { runDailySalesReport, buildReport };
