// #10 Abandoned cart / wishlist reminder. Runs weekly (Mon 08:00).
//
// Note: this project has no Cart model — checkout is direct (order created
// from a posted item list). The closest analog is Wishlist items that the
// user has held for a while without buying. We email those users.
//
// What it does: for every user who has wishlist items created > `staleDays`
// days ago (default 7), send one email listing those items.
//
// Why a job: re-engagement email at the right cadence converts. Sending it
// per-event would feel like spam; weekly batch is the sweet spot.

const { Op } = require("sequelize");
const { Wishlist, User, Product } = require("../../model");
const emailService = require("../../service/emailService");

async function runAbandonedCartReminder({ staleDays = 7, now = new Date() } = {}) {
  const cutoff = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);

  const items = await Wishlist.findAll({
    where: { created_at: { [Op.lt]: cutoff } },
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Product, as: "product", attributes: ["id", "name", "price", "stock"] },
    ],
  });

  // Group by user — one email per user, listing all their stale items.
  const byUser = new Map();
  for (const w of items) {
    if (!w.user || !w.product) continue;
    if (!byUser.has(w.user.id)) byUser.set(w.user.id, { user: w.user, products: [] });
    byUser.get(w.user.id).products.push(w.product);
  }

  let emailsSent = 0;
  for (const { user, products } of byUser.values()) {
    if (!user.email) continue;
    const list = products
      .map((p) => `<li>${p.name} — ${p.price}${p.stock <= 0 ? " (currently out of stock)" : ""}</li>`)
      .join("");
    const html = `
      <h2>Still thinking about these, ${user.name}?</h2>
      <p>Items you saved a while ago:</p>
      <ul>${list}</ul>
    `;
    const r = await emailService.sendCustom(user.email, "Items in your wishlist", html);
    if (r && r.success) emailsSent += 1;
  }

  return { usersTargeted: byUser.size, emailsSent, staleDays };
}

module.exports = { runAbandonedCartReminder };
