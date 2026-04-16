const authService = require("../service/authService");

const authController = {
  async register(req, res, next) {
    try {
      const data = await authService.register(req.body);
      res.status(201).json({ success: true, message: "Registration successful", data });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      if (result.error) {
        return res.status(401).json({ success: false, message: result.error });
      }
      res.json({ success: true, message: "Login successful", data: result });
    } catch (error) {
      next(error);
    }
  },

  async profile(req, res, next) {
    try {
      const data = await authService.getProfile(req.user.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
