const aiService = require("../service/aiService");
const { Review, Product, Order, OrderItem } = require("../model");

const aiController = {
  /**
   * GET /api/ai/recommendations
   * Authenticated — uses req.user.id to look up purchase & browsing history
   */
  async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 5;

      // Fetch user's purchased products as purchase history
      const orders = await Order.findAll({
        where: { user_id: userId },
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
          },
        ],
        limit: 10,
      });

      const purchaseHistory = [];
      orders.forEach((order) => {
        (order.items || []).forEach((item) => {
          if (item.product) purchaseHistory.push(item.product);
        });
      });

      // Browsing history can come from query param or be empty
      const browsingHistory = [];

      const recommendations = await aiService.getProductRecommendations(
        userId,
        purchaseHistory,
        browsingHistory,
        limit
      );

      res.json({ success: true, data: recommendations });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/sentiment
   * Admin only — body: { review_text }
   */
  async analyzeSentiment(req, res, next) {
    try {
      const { review_text } = req.body;
      if (!review_text || typeof review_text !== "string") {
        return res.status(400).json({ success: false, message: "review_text is required" });
      }

      const result = await aiService.analyzeReviewSentiment(review_text);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/sentiment/bulk
   * Admin only — body: { review_ids: [1, 2, 3] }
   */
  async bulkAnalyzeSentiment(req, res, next) {
    try {
      const { review_ids } = req.body;
      if (!Array.isArray(review_ids) || review_ids.length === 0) {
        return res.status(400).json({ success: false, message: "review_ids must be a non-empty array" });
      }

      const reviews = await Review.findAll({ where: { id: review_ids } });
      if (reviews.length === 0) {
        return res.status(404).json({ success: false, message: "No reviews found for the given ids" });
      }

      const results = await aiService.bulkAnalyzeSentiment(reviews.map((r) => r.toJSON()));
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/search
   * Public — body: { query }
   * Returns structured search params + matching products
   */
  async naturalLanguageSearch(req, res, next) {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ success: false, message: "query is required" });
      }

      const params = await aiService.naturalLanguageSearch(query);

      // Build product search using the extracted params
      const { Op } = require("sequelize");
      const where = {};

      if (params.search_terms) {
        where[Op.or] = [
          { name: { [Op.like]: `%${params.search_terms}%` } },
          { description: { [Op.like]: `%${params.search_terms}%` } },
        ];
      }

      if (params.min_price || params.max_price) {
        where.price = {};
        if (params.min_price) where.price[Op.gte] = params.min_price;
        if (params.max_price) where.price[Op.lte] = params.max_price;
      }

      where.status = "active";

      const products = await Product.findAll({ where, limit: 20 });

      res.json({
        success: true,
        search_params: params,
        data: products.map((p) => p.toJSON()),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/chat
   * Public — body: { message, conversation_history: [] }
   */
  async chatbot(req, res, next) {
    try {
      const { message, conversation_history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ success: false, message: "message is required" });
      }

      const contextData = {};
      const result = await aiService.getChatbotResponse(message, conversation_history || [], contextData);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = aiController;
