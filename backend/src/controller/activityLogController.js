const activityLogService = require("../service/activityLogService");

const activityLogController = {
  async findAll(req, res, next) {
    try {
      const result = await activityLogService.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findByUser(req, res, next) {
    try {
      const result = await activityLogService.findByUser(req.user.id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = activityLogController;
