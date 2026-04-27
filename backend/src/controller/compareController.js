const compareService = require("../service/compareService");

const compareController = {
  /**
   * POST /api/compare
   * Body: { product_ids: [1, 2, 3] }   (2–4 IDs)
   *
   * Returns:
   *   {
   *     success: true,
   *     products: [...],
   *     comparison: { price: [...], stock: [...], brand: [...], rating: [...], category: [...] }
   *   }
   */
  async compare(req, res, next) {
    try {
      const { product_ids } = req.body;

      if (!product_ids) {
        return res.status(400).json({
          success: false,
          message: "product_ids is required",
        });
      }

      if (!Array.isArray(product_ids)) {
        return res.status(400).json({
          success: false,
          message: "product_ids must be an array",
        });
      }

      const { products, comparison } = await compareService.compareProducts(product_ids);

      res.json({ success: true, products, comparison });
    } catch (error) {
      // Propagate domain-level HTTP errors (400/404) set by the service
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = compareController;
