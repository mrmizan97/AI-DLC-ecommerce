const { Notification, User } = require("../model");
const { emitToUser } = require("../socket");

const notificationService = {
  async findAll(userId, query = {}) {
    const { page = 1, limit = 20, unread_only } = query;
    const offset = (page - 1) * limit;
    const where = { user_id: userId };
    if (unread_only === "true") where.read = false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  async unreadCount(userId) {
    return await Notification.count({ where: { user_id: userId, read: false } });
  },

  async markRead(id, userId) {
    const n = await Notification.findByPk(id);
    if (!n || n.user_id !== userId) return null;
    return await n.update({ read: true });
  },

  async markAllRead(userId) {
    await Notification.update({ read: true }, { where: { user_id: userId, read: false } });
    return true;
  },

  async delete(id, userId) {
    const n = await Notification.findByPk(id);
    if (!n || n.user_id !== userId) return null;
    await n.destroy();
    return n;
  },

  async deleteAll(userId) {
    await Notification.destroy({ where: { user_id: userId } });
    return true;
  },

  // Internal helpers used by other services

  async createForUser(userId, { type, message, order_id = null }) {
    const notification = await Notification.create({
      user_id: userId,
      type,
      message,
      order_id,
    });
    emitToUser(userId, "notification:new", notification);
    return notification;
  },

  async createForAllAdmins({ type, message, order_id = null }) {
    const admins = await User.findAll({ where: { role: "admin", is_active: true }, attributes: ["id"] });
    const created = [];
    for (const admin of admins) {
      const n = await Notification.create({
        user_id: admin.id,
        type,
        message,
        order_id,
      });
      emitToUser(admin.id, "notification:new", n);
      created.push(n);
    }
    return created;
  },
};

module.exports = notificationService;
