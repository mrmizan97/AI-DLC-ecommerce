const Slider = require("../model/Slider");

const sliderService = {
  async create(data) {
    return await Slider.create(data);
  },

  async findAll({ active_only } = {}) {
    const where = {};
    if (active_only === "true" || active_only === true) {
      where.is_active = true;
    }
    return await Slider.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"],
      ],
    });
  },

  async findById(id) {
    return await Slider.findByPk(id);
  },

  async update(id, data) {
    const record = await Slider.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id) {
    const record = await Slider.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  },
};

module.exports = sliderService;
