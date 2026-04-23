const reviewService = require("../service/reviewService");

const reviewController = {
  async listAll(req, res, next) {
    try {
      const result = await reviewService.listAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async listForProduct(req, res, next) {
    try {
      const data = await reviewService.listForProduct(req.params.id);
      const stats = await reviewService.statsForProduct(req.params.id);
      res.json({ success: true, data, stats });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { rating, comment } = req.body;
      if (!rating || !Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be an integer 1-5" });
      }
      const data = await reviewService.create(req.params.id, req.user.id, { rating, comment });
      if (data?.notFound) return res.status(404).json({ success: false, message: data.error });
      if (data?.error) return res.status(400).json({ success: false, message: data.error });
      res.status(201).json({ success: true, message: "Review added", data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { rating, comment } = req.body;
      if (rating !== undefined && (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5)) {
        return res.status(400).json({ success: false, message: "Rating must be an integer 1-5" });
      }
      const data = await reviewService.update(req.params.id, req.user.id, req.user.role, { rating, comment });
      if (!data) return res.status(404).json({ success: false, message: "Review not found" });
      if (data?.forbidden) return res.status(403).json({ success: false, message: data.error });
      res.json({ success: true, message: "Review updated", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await reviewService.delete(req.params.id, req.user.id, req.user.role);
      if (!data) return res.status(404).json({ success: false, message: "Review not found" });
      if (data?.forbidden) return res.status(403).json({ success: false, message: data.error });
      res.json({ success: true, message: "Review deleted" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reviewController;
