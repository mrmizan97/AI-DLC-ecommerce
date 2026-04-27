const couponService = require("../service/couponService");

const couponController = {
  async create(req, res, next) {
    try {
      const data = await couponService.create(req.body);
      res.status(201).json({ success: true, message: "Coupon created successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const result = await couponService.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await couponService.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await couponService.update(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }
      res.json({ success: true, message: "Coupon updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await couponService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }
      res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  async validate(req, res, next) {
    try {
      const { code, order_amount } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, message: "Coupon code is required" });
      }
      if (order_amount === undefined || order_amount === null) {
        return res.status(400).json({ success: false, message: "order_amount is required" });
      }

      const result = await couponService.apply(code, order_amount);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error.message) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = couponController;
