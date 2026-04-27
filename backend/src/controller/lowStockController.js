const lowStockService = require("../service/lowStockService");

const lowStockController = {
  async findAll(req, res, next) {
    try {
      const result = await lowStockService.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async resolve(req, res, next) {
    try {
      const alert = await lowStockService.resolve(req.params.id);
      if (!alert) {
        return res.status(404).json({ success: false, message: "Alert not found" });
      }
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  },

  async getUnresolved(req, res, next) {
    try {
      const data = await lowStockService.getUnresolved();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = lowStockController;
