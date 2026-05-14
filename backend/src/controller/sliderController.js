const sliderService = require("../service/sliderService");

const sliderController = {
  async create(req, res, next) {
    try {
      const data = await sliderService.create(req.body);
      res.status(201).json({ success: true, message: "Slider created successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const data = await sliderService.findAll(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getActive(req, res, next) {
    try {
      const data = await sliderService.findAll({ active_only: "true" });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await sliderService.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Slider not found" });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await sliderService.update(req.params.id, req.body);
      if (!data) return res.status(404).json({ success: false, message: "Slider not found" });
      res.json({ success: true, message: "Slider updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await sliderService.delete(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Slider not found" });
      res.json({ success: true, message: "Slider deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = sliderController;
