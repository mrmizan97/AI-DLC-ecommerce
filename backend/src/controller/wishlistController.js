const wishlistService = require("../service/wishlistService");

const wishlistController = {
  async add(req, res, next) {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.body.product_id, 10);
      if (!productId) {
        return res.status(400).json({ success: false, message: "product_id is required" });
      }
      const data = await wishlistService.addItem(userId, productId);
      res.status(201).json({ success: true, message: "Product added to wishlist", data });
    } catch (error) {
      if (error.status === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId, 10);
      const data = await wishlistService.removeItem(userId, productId);
      if (!data) {
        return res.status(404).json({ success: false, message: "Wishlist item not found" });
      }
      res.json({ success: true, message: "Product removed from wishlist" });
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await wishlistService.list(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async check(req, res, next) {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId, 10);
      const data = await wishlistService.check(userId, productId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = wishlistController;
