const { Op } = require("sequelize");
const { Category, Media } = require("../model");
const cache = require("../lib/cache");

const NS = "categories";
const TTL = 300;
const mediaInclude = { model: Media, as: "media", required: false };

const categoryService = {
  async create(data) {
    const record = await Category.create(data);
    cache.invalidate(NS);
    return record;
  },

  async findAll(query = {}) {
    const { search } = query;
    const cacheKey = search ? `s:${search}` : "all";
    return cache.memo(NS, cacheKey, TTL, async () => {
      const where = {};
      if (search) where.name = { [Op.like]: `%${search}%` };
      return await Category.findAll({
        where,
        include: [mediaInclude],
        order: [["name", "ASC"]],
      });
    });
  },

  async findById(id) {
    return await Category.findByPk(id, { include: [mediaInclude] });
  },

  async update(id, data) {
    const record = await Category.findByPk(id);
    if (!record) return null;
    const updated = await record.update(data);
    cache.invalidate(NS);
    return updated;
  },

  async delete(id) {
    const record = await Category.findByPk(id);
    if (!record) return null;
    await record.destroy();
    cache.invalidate(NS);
    return record;
  },
};

module.exports = categoryService;
