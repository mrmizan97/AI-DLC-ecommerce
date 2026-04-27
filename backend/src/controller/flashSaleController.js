const flashSaleService = require("../service/flashSaleService");

const flashSaleController = {
  async create(req, res, next) {
    try {
      const data = await flashSaleService.create(req.body);
      res.status(201).json({ success: true, message: "Flash sale created successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const result = await flashSaleService.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await flashSaleService.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Flash sale not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getActive(req, res, next) {
    try {
      const data = await flashSaleService.getActiveFlashSales();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await flashSaleService.update(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: "Flash sale not found" });
      }
      res.json({ success: true, message: "Flash sale updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await flashSaleService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Flash sale not found" });
      }
      res.json({ success: true, message: "Flash sale deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = flashSaleController;
