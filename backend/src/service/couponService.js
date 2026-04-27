const { Op } = require("sequelize");
const { Coupon } = require("../model");

const couponService = {
  async create(data) {
    return await Coupon.create(data);
  },

  async findAll(query = {}) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Coupon.findAndCountAll({
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
    return await Coupon.findByPk(id);
  },

  async update(id, data) {
    const record = await Coupon.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id) {
    const record = await Coupon.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  },

  async validate(code, orderAmount) {
    const coupon = await Coupon.findOne({ where: { code } });

    if (!coupon) {
      throw new Error("Coupon code not found");
    }

    if (!coupon.is_active) {
      throw new Error("Coupon is inactive");
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new Error("Coupon has expired");
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      throw new Error("Coupon usage limit has been reached");
    }

    if (parseFloat(orderAmount) < parseFloat(coupon.min_order_amount)) {
      throw new Error(
        `Order amount must be at least ${coupon.min_order_amount} to use this coupon`
      );
    }

    return coupon;
  },

  async apply(code, orderAmount) {
    const coupon = await couponService.validate(code, orderAmount);

    let discount = 0;
    const amount = parseFloat(orderAmount);

    if (coupon.type === "percentage") {
      discount = parseFloat(((amount * parseFloat(coupon.value)) / 100).toFixed(2));
    } else {
      discount = parseFloat(Math.min(parseFloat(coupon.value), amount).toFixed(2));
    }

    const finalAmount = parseFloat((amount - discount).toFixed(2));

    return { coupon, discount, finalAmount };
  },

  async incrementUsage(id) {
    const record = await Coupon.findByPk(id);
    if (!record) return null;
    return await record.increment("used_count");
  },
};

module.exports = couponService;
