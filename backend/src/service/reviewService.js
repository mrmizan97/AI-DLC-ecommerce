const { Review, User, Product, sequelize } = require("../model");
const { fn, col, literal, Op } = require("sequelize");

const reviewService = {
  async listAll(query = {}) {
    const {
      page = 1,
      limit = 20,
      product_id,
      user_id,
      min_rating,
      max_rating,
      search,
      sort_by = "created_at",
      sort_order = "DESC",
    } = query;

    const offset = (page - 1) * limit;
    const where = {};
    if (product_id) where.product_id = product_id;
    if (user_id) where.user_id = user_id;
    if (min_rating || max_rating) {
      where.rating = {};
      if (min_rating) where.rating[Op.gte] = parseInt(min_rating);
      if (max_rating) where.rating[Op.lte] = parseInt(max_rating);
    }
    if (search) where.comment = { [Op.like]: `%${search}%` };

    const safeSortBy = ["created_at", "rating"].includes(sort_by) ? sort_by : "created_at";
    const safeSortOrder = ["ASC", "DESC"].includes(String(sort_order).toUpperCase())
      ? String(sort_order).toUpperCase()
      : "DESC";

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Product, as: "product", attributes: ["id", "name", "sku"] },
      ],
      order: [[safeSortBy, safeSortOrder]],
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

  async listForProduct(productId) {
    return await Review.findAll({
      where: { product_id: productId },
      include: [{ model: User, as: "user", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });
  },

  async statsForProduct(productId) {
    const row = await Review.findOne({
      where: { product_id: productId },
      attributes: [
        [fn("AVG", col("rating")), "average"],
        [fn("COUNT", col("id")), "count"],
      ],
      raw: true,
    });
    return {
      average: row?.average ? parseFloat(parseFloat(row.average).toFixed(2)) : 0,
      count: parseInt(row?.count || 0, 10),
    };
  },

  async statsForProducts(productIds) {
    if (!productIds.length) return {};
    const rows = await Review.findAll({
      where: { product_id: productIds },
      attributes: [
        "product_id",
        [fn("AVG", col("rating")), "average"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["product_id"],
      raw: true,
    });
    const map = {};
    for (const r of rows) {
      map[r.product_id] = {
        average: r.average ? parseFloat(parseFloat(r.average).toFixed(2)) : 0,
        count: parseInt(r.count || 0, 10),
      };
    }
    return map;
  },

  async create(productId, userId, { rating, comment }) {
    const product = await Product.findByPk(productId);
    if (!product) return { error: "Product not found", notFound: true };

    const existing = await Review.findOne({ where: { product_id: productId, user_id: userId } });
    if (existing) return { error: "You already reviewed this product" };

    const review = await Review.create({
      product_id: productId,
      user_id: userId,
      rating,
      comment,
    });
    return await Review.findByPk(review.id, {
      include: [{ model: User, as: "user", attributes: ["id", "name"] }],
    });
  },

  async update(id, userId, role, { rating, comment }) {
    const review = await Review.findByPk(id);
    if (!review) return null;
    if (role !== "admin" && review.user_id !== userId) {
      return { error: "Not allowed", forbidden: true };
    }
    const patch = {};
    if (rating !== undefined) patch.rating = rating;
    if (comment !== undefined) patch.comment = comment;
    await review.update(patch);
    return await Review.findByPk(id, {
      include: [{ model: User, as: "user", attributes: ["id", "name"] }],
    });
  },

  async delete(id, userId, role) {
    const review = await Review.findByPk(id);
    if (!review) return null;
    if (role !== "admin" && review.user_id !== userId) {
      return { error: "Not allowed", forbidden: true };
    }
    await review.destroy();
    return review;
  },
};

module.exports = reviewService;
