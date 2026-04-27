const { Op } = require("sequelize");
const FlashSale = require("../model/FlashSale");
const Product = require("../model/Product");

// Ensure association is available even before model/index.js sets it up
if (!FlashSale.associations || !FlashSale.associations.product) {
  FlashSale.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  Product.hasMany(FlashSale, { foreignKey: "product_id", as: "flash_sales" });
}

const productInclude = {
  model: Product,
  as: "product",
  attributes: ["id", "name", "sku", "price", "image_url", "status"],
};

const flashSaleService = {
  async create(data) {
    return await FlashSale.create(data);
  },

  async findAll(query = {}) {
    const { page = 1, limit = 20, active_only } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (active_only === "true" || active_only === true) {
      const now = new Date();
      where.is_active = true;
      where.start_time = { [Op.lte]: now };
      where.end_time = { [Op.gte]: now };
    }

    const { count, rows } = await FlashSale.findAndCountAll({
      where,
      include: [productInclude],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
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
    return await FlashSale.findByPk(id, { include: [productInclude] });
  },

  async findActiveByProduct(productId) {
    const now = new Date();
    return await FlashSale.findOne({
      where: {
        product_id: productId,
        is_active: true,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now },
      },
      include: [productInclude],
    });
  },

  async update(id, data) {
    const record = await FlashSale.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id) {
    const record = await FlashSale.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  },

  async getActiveFlashSales() {
    const now = new Date();
    return await FlashSale.findAll({
      where: {
        is_active: true,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now },
      },
      include: [productInclude],
      order: [["start_time", "ASC"]],
    });
  },
};

module.exports = flashSaleService;
