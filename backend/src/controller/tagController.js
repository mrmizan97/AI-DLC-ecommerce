const tagService = require("../service/tagService");

const tagController = {
  async create(req, res, next) {
    try {
      const data = await tagService.create(req.body);
      res.status(201).json({ success: true, message: "Tag created successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const data = await tagService.findAll(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await tagService.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Tag not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await tagService.update(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: "Tag not found" });
      }
      res.json({ success: true, message: "Tag updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await tagService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Tag not found" });
      }
      res.json({ success: true, message: "Tag deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = tagController;
