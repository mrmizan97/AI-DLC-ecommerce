const statsService = require("../service/statsService");

const statsController = {
  async dashboard(req, res, next) {
    try {
      const data = await statsService.dashboard();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = statsController;
