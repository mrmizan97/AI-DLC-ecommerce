const notificationService = require("../service/notificationService");

const notificationController = {
  async findAll(req, res, next) {
    try {
      const result = await notificationService.findAll(req.user.id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async unreadCount(req, res, next) {
    try {
      const count = await notificationService.unreadCount(req.user.id);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req, res, next) {
    try {
      const data = await notificationService.markRead(req.params.id, req.user.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      res.json({ success: true, message: "Marked as read", data });
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req, res, next) {
    try {
      await notificationService.markAllRead(req.user.id);
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await notificationService.delete(req.params.id, req.user.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
      next(error);
    }
  },

  async deleteAll(req, res, next) {
    try {
      await notificationService.deleteAll(req.user.id);
      res.json({ success: true, message: "All notifications deleted" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = notificationController;
