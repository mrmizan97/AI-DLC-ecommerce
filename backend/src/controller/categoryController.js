const categoryService = require("../service/categoryService");

const categoryController = {
  async create(req, res, next) {
    try {
      const data = await categoryService.create(req.body);
      res.status(201).json({ success: true, message: "Category created successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const data = await categoryService.findAll(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await categoryService.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await categoryService.update(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, message: "Category updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await categoryService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = categoryController;
