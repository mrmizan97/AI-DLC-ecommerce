const addressService = require("../service/addressService");

const addressController = {
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await addressService.create(userId, req.body);
      res.status(201).json({ success: true, message: "Address created successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await addressService.findAll(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await addressService.findById(userId, req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await addressService.update(userId, req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }
      res.json({ success: true, message: "Address updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await addressService.delete(userId, req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }
      res.json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  async setDefault(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await addressService.setDefault(userId, req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }
      res.json({ success: true, message: "Default address updated", data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = addressController;
