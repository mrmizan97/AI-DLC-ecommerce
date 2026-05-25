// Tests for #8 wishlistBackInStock — sends one notification per wishlister
// when a product is back in stock. Email + socket mocked.

const shared = require("../shared");
const { Wishlist, Product, Notification } = require("../../src/model");
const emailService = require("../../src/service/emailService");
const { runWishlistBackInStock } = require("../../src/lib/jobs/wishlistBackInStock");

describe("#8 wishlist-back-in-stock", () => {
  beforeEach(async () => {
    await Wishlist.destroy({ where: {} });
    await Notification.destroy({ where: { user_id: shared.customerId, type: "wishlist_back_in_stock" } });
    await Product.update({ stock: 50 }, { where: { id: shared.productId } });
  });

  test("creates Notification and emails wishlisters when stock > 0", async () => {
    await Wishlist.create({ user_id: shared.customerId, product_id: shared.productId });
    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true });

    const r = await runWishlistBackInStock({ productId: shared.productId });
    expect(r.notified).toBe(1);
    const n = await Notification.findOne({ where: { user_id: shared.customerId, type: "wishlist_back_in_stock" } });
    expect(n).not.toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("skips when product is still out of stock", async () => {
    await Product.update({ stock: 0 }, { where: { id: shared.productId } });
    await Wishlist.create({ user_id: shared.customerId, product_id: shared.productId });
    const r = await runWishlistBackInStock({ productId: shared.productId });
    expect(r.notified).toBe(0);
    expect(r.skipped).toBeDefined();
  });
});
