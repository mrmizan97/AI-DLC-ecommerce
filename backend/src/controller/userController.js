const userService = require("../service/userService");

const userController = {
  async findAll(req, res, next) {
    try {
      const result = await userService.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const data = await userService.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await userService.update(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User updated successfully", data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await userService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;
