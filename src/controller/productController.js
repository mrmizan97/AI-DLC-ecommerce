const productService = require("../service/productService");

const productController = {
  async create(req, res, next) {
    try {
      const data = await productService.create(req.body);
      res.status(201).json({ success: true, message: "Product created successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const result = await productService.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await productService.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await productService.update(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, message: "Product updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await productService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  async addTags(req, res, next) {
    try {
      const data = await productService.addTags(req.params.id, req.body.tag_ids);
      if (!data) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, message: "Tags added successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async removeTags(req, res, next) {
    try {
      const data = await productService.removeTags(req.params.id, req.body.tag_ids);
      if (!data) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, message: "Tags removed successfully", data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = productController;
