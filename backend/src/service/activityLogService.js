const { Op } = require("sequelize");
const { User } = require("../model");
const ActivityLog = require("../model/ActivityLog");

// Define associations if not already set
if (!ActivityLog.associations.user) {
  ActivityLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasMany(ActivityLog, { foreignKey: "user_id", as: "activity_logs" });
}

const activityLogService = {
  async log(data) {
    const { user_id, action, entity_type, entity_id, description, ip_address, metadata } = data;
    return await ActivityLog.create({
      user_id: user_id || null,
      action,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      description: description || null,
      ip_address: ip_address || null,
      metadata: metadata || null,
    });
  },

  async findAll(query = {}) {
    const {
      page = 1,
      limit = 20,
      user_id,
      action,
      entity_type,
      start_date,
      end_date,
    } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (user_id) where.user_id = user_id;
    if (action) where.action = { [Op.like]: `%${action}%` };
    if (entity_type) where.entity_type = entity_type;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      distinct: true,
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

  async findByUser(userId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      distinct: true,
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

  async findById(id) {
    return await ActivityLog.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
    });
  },
};

module.exports = activityLogService;
