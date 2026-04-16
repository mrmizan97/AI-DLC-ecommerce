const { Op } = require("sequelize");
const { Tag } = require("../model");

const tagService = {
  async create(data) {
    return await Tag.create(data);
  },

  async findAll(query = {}) {
    const { search } = query;
    const where = {};

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    return await Tag.findAll({
      where,
      order: [["name", "ASC"]],
    });
  },

  async findById(id) {
    return await Tag.findByPk(id);
  },

  async update(id, data) {
    const record = await Tag.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id) {
    const record = await Tag.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  },
};

module.exports = tagService;
