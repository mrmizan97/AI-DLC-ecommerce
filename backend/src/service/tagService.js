const { Op } = require("sequelize");
const { Tag } = require("../model");
const cache = require("../lib/cache");

const NS = "tags";
const TTL = 300;

const tagService = {
  async create(data) {
    const record = await Tag.create(data);
    cache.invalidate(NS);
    return record;
  },

  async findAll(query = {}) {
    const { search } = query;
    const cacheKey = search ? `s:${search}` : "all";
    return cache.memo(NS, cacheKey, TTL, async () => {
      const where = {};
      if (search) where.name = { [Op.like]: `%${search}%` };
      return await Tag.findAll({
        where,
        order: [["name", "ASC"]],
      });
    });
  },

  async findById(id) {
    return await Tag.findByPk(id);
  },

  async update(id, data) {
    const record = await Tag.findByPk(id);
    if (!record) return null;
    const updated = await record.update(data);
    cache.invalidate(NS);
    return updated;
  },

  async delete(id) {
    const record = await Tag.findByPk(id);
    if (!record) return null;
    await record.destroy();
    cache.invalidate(NS);
    return record;
  },
};

module.exports = tagService;
