// #8 Wishlist back-in-stock notification.
//
// EVENT-DRIVEN, not scheduled. Enqueue it whenever a product's stock goes
// from 0 to > 0 (e.g. inside productService when stock is updated).
//
// What it does: finds every user who wishlisted the product and sends them
// a notification (DB row + socket emit if connected + email if SMTP set).
//
// Why a job:
//   - The producer (productService.update) shouldn't wait for N emails.
//   - Retries are free — if SMTP is briefly down we don't lose notifications.
//   - Idempotency: pass an idempotencyKey like `wishlist-back:<productId>:<date>`
//     so multiple stock-up events in a day don't spam users.

const { Wishlist, User, Product, Notification } = require("../../model");
const emailService = require("../../service/emailService");
const { emitToUser } = require("../../socket");

async function runWishlistBackInStock({ productId }) {
  if (!productId) return { notified: 0, error: "productId is required" };

  const product = await Product.findByPk(productId);
  if (!product || product.stock <= 0) {
    return { notified: 0, productId, skipped: "not back in stock" };
  }

  const wishlists = await Wishlist.findAll({
    where: { product_id: productId },
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
  });

  let notified = 0;
  for (const w of wishlists) {
    if (!w.user) continue;

    // DB notification (always)
    await Notification.create({
      user_id: w.user.id,
      type: "wishlist_back_in_stock",
      title: `Back in stock: ${product.name}`,
      message: `The item you wishlisted is available again.`,
      read: false,
    });

    // Socket push to live clients
    try {
      emitToUser?.(w.user.id, "notification", {
        type: "wishlist_back_in_stock",
        productId: product.id,
        productName: product.name,
      });
    } catch (_) { /* socket may not be initialised in tests */ }

    // Email (best effort)
    if (w.user.email) {
      await emailService.sendCustom(
        w.user.email,
        `Back in stock: ${product.name}`,
        `<p>Hi ${w.user.name},</p><p><strong>${product.name}</strong> is available again. Grab it before it sells out.</p>`
      );
    }
    notified += 1;
  }

  return { notified, productId, productName: product.name };
}

module.exports = { runWishlistBackInStock };
