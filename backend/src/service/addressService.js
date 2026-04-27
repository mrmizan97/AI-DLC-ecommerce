const { Address } = require("../model");

const addressService = {
  async create(userId, data) {
    if (data.is_default) {
      await Address.update({ is_default: false }, { where: { user_id: userId } });
    }
    return await Address.create({ ...data, user_id: userId });
  },

  async findAll(userId) {
    return await Address.findAll({
      where: { user_id: userId },
      order: [["is_default", "DESC"], ["created_at", "DESC"]],
    });
  },

  async findById(userId, id) {
    const address = await Address.findOne({ where: { id, user_id: userId } });
    return address || null;
  },

  async update(userId, id, data) {
    const address = await Address.findOne({ where: { id, user_id: userId } });
    if (!address) return null;
    if (data.is_default) {
      await Address.update({ is_default: false }, { where: { user_id: userId } });
    }
    return await address.update(data);
  },

  async delete(userId, id) {
    const address = await Address.findOne({ where: { id, user_id: userId } });
    if (!address) return null;
    await address.destroy();
    return address;
  },

  async setDefault(userId, id) {
    const address = await Address.findOne({ where: { id, user_id: userId } });
    if (!address) return null;
    await Address.update({ is_default: false }, { where: { user_id: userId } });
    return await address.update({ is_default: true });
  },
};

module.exports = addressService;
