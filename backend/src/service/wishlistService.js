const { Wishlist, Product, Category, Media } = require("../model");

const wishlistIncludes = [
  {
    model: Product,
    as: "product",
    include: [
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: Media, as: "media", required: false },
    ],
  },
];

const wishlistService = {
  async addItem(userId, productId) {
    const existing = await Wishlist.findOne({ where: { user_id: userId, product_id: productId } });
    if (existing) {
      const error = new Error("Product already in wishlist");
      error.status = 409;
      throw error;
    }
    const item = await Wishlist.create({ user_id: userId, product_id: productId });
    return await Wishlist.findByPk(item.id, { include: wishlistIncludes });
  },

  async removeItem(userId, productId) {
    const item = await Wishlist.findOne({ where: { user_id: userId, product_id: productId } });
    if (!item) return null;
    await item.destroy();
    return item;
  },

  async list(userId) {
    return await Wishlist.findAll({
      where: { user_id: userId },
      include: wishlistIncludes,
      order: [["created_at", "DESC"]],
    });
  },

  async check(userId, productId) {
    const item = await Wishlist.findOne({ where: { user_id: userId, product_id: productId } });
    return { wishlisted: !!item };
  },
};

module.exports = wishlistService;
