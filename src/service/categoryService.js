const { Op } = require("sequelize");
const { Category } = require("../model");

const categoryService = {
  async create(data) {
    return await Category.create(data);
  },

  async findAll(query = {}) {
    const { search } = query;
    const where = {};

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    return await Category.findAll({
      where,
      order: [["name", "ASC"]],
    });
  },

  async findById(id) {
    return await Category.findByPk(id);
  },

  async update(id, data) {
    const record = await Category.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id) {
    const record = await Category.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  },
};

module.exports = categoryService;
