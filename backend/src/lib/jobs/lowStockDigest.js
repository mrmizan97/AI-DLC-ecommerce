// #5 Low-stock digest. Runs at 09:00 daily.
//
// What it does: collects every unresolved LowStockAlert and emails ONE
// digest to each admin (instead of N real-time alerts during the night).
// Resolves alerts whose product is no longer low-stock.
//
// Why a job: per-order alerts are noisy; admins glaze over. A morning
// digest is what they'll actually read.

const { Op } = require("sequelize");
const { LowStockAlert, Product, User } = require("../../model");
const emailService = require("../../service/emailService");

async function runLowStockDigest({ threshold = 10 } = {}) {
  // Resolve any alert whose product has recovered.
  const open = await LowStockAlert.findAll({
    where: { resolved: false },
    include: [{ model: Product, as: "product" }],
  });

  const stillLow = [];
  for (const a of open) {
    if (!a.product) continue;
    if (a.product.stock > threshold) {
      await a.update({ resolved: true, current_stock: a.product.stock });
    } else {
      stillLow.push({
        id: a.product.id,
        name: a.product.name,
        sku: a.product.sku,
        stock: a.product.stock,
      });
    }
  }

  if (stillLow.length === 0) {
    return { digestSent: 0, productsLow: 0 };
  }

  const admins = await User.findAll({ where: { role: "admin" }, attributes: ["email"] });

  const rows = stillLow
    .map((p) => `<tr><td>${p.name}</td><td>${p.sku || "-"}</td><td>${p.stock}</td></tr>`)
    .join("");
  const html = `
    <h2>Low-stock digest (${stillLow.length} products)</h2>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Product</th><th>SKU</th><th>Stock</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  let sent = 0;
  for (const a of admins) {
    const r = await emailService.sendCustom(a.email, `Low stock: ${stillLow.length} products`, html);
    if (r && r.success) sent += 1;
  }
  return { digestSent: sent, productsLow: stillLow.length, adminsTargeted: admins.length };
}

module.exports = { runLowStockDigest };
