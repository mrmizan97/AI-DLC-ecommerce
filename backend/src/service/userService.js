const { Op } = require("sequelize");
const { User, Media } = require("../model");

const mediaInclude = { model: Media, as: "media", required: false };

const ALLOWED_UPDATE_FIELDS = ["name", "phone", "role", "is_active"];

const userService = {
  async findAll(query = {}) {
    const { page = 1, limit = 10, role, search } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (role) where.role = role;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [mediaInclude],
      distinct: true,
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

  async findById(id) {
    return await User.findByPk(id, { include: [mediaInclude] });
  },

  async update(id, data) {
    const record = await User.findByPk(id);
    if (!record) return null;

    const filteredData = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    }

    return await record.update(filteredData);
  },

  async delete(id) {
    const record = await User.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  },
};

module.exports = userService;
