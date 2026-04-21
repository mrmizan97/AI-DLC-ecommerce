const orderService = require("../service/orderService");

const orderController = {
  async create(req, res, next) {
    try {
      const data = await orderService.create(req.user.id, req.body);
      res.status(201).json({ success: true, message: "Order placed successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const result = await orderService.findAll(req.query, req.user.id, req.user.role);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await orderService.findById(req.params.id, req.user.id, req.user.role);
      if (!data) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const result = await orderService.updateStatus(req.params.id, req.body.status);
      if (!result) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      if (result.error) {
        return res.status(400).json({ success: false, message: result.error });
      }
      res.json({ success: true, message: "Order status updated successfully", data: result });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req, res, next) {
    try {
      const result = await orderService.cancel(req.params.id, req.user.id, req.user.role);
      if (!result) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      if (result.error) {
        const status = result.error === "Only admin can cancel orders" ? 403 : 400;
        return res.status(status).json({ success: false, message: result.error });
      }
      res.json({ success: true, message: "Order cancelled successfully", data: result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = orderController;
