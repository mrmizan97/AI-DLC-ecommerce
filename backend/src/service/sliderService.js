const Slider = require("../model/Slider");
const cache = require("../lib/cache");

const NS = "sliders";
const TTL = 300;

const sliderService = {
  async create(data) {
    const record = await Slider.create(data);
    cache.invalidate(NS);
    return record;
  },

  async findAll({ active_only } = {}) {
    const isActiveFilter = active_only === "true" || active_only === true;
    const cacheKey = isActiveFilter ? "active" : "all";
    return cache.memo(NS, cacheKey, TTL, async () => {
      const where = {};
      if (isActiveFilter) where.is_active = true;
      return await Slider.findAll({
        where,
        order: [
          ["sort_order", "ASC"],
          ["id", "ASC"],
        ],
      });
    });
  },

  async findById(id) {
    return await Slider.findByPk(id);
  },

  async update(id, data) {
    const record = await Slider.findByPk(id);
    if (!record) return null;
    const updated = await record.update(data);
    cache.invalidate(NS);
    return updated;
  },

  async delete(id) {
    const record = await Slider.findByPk(id);
    if (!record) return null;
    await record.destroy();
    cache.invalidate(NS);
    return record;
  },
};

module.exports = sliderService;
