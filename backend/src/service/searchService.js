const { Op, fn, col } = require("sequelize");
const { Product, Category, Tag, Review } = require("../model");

const searchService = {
  /**
   * Typeahead autocomplete — searches products by name, brand, or sku.
   * Returns a lightweight projection suitable for dropdown suggestions.
   */
  async autocomplete(query, limit = 10) {
    if (!query || !String(query).trim()) {
      return [];
    }

    const q = String(query).trim();
    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { brand: { [Op.like]: `%${q}%` } },
          { sku: { [Op.like]: `%${q}%` } },
        ],
        status: "active",
      },
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
      attributes: ["id", "name", "brand", "price", "image_url", "sku"],
      limit: safeLimit,
      order: [["name", "ASC"]],
    });

    return products.map((p) => {
      const plain = p.toJSON();
      return {
        id: plain.id,
        name: plain.name,
        brand: plain.brand,
        price: plain.price,
        image_url: plain.image_url,
        sku: plain.sku,
        category: plain.category ? plain.category.name : null,
      };
    });
  },

  /**
   * Full enhanced product search with filters, pagination, and review stats.
   * Supports: q, category_id, min_price, max_price, tags (comma-separated IDs),
   *           page, limit.
   */
  async searchProducts(query = {}) {
    const {
      q,
      category_id,
      min_price,
      max_price,
      tags,
      page = 1,
      limit = 10,
    } = query;

    const where = { status: "active" };

    if (q && String(q).trim()) {
      const term = String(q).trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${term}%` } },
        { brand: { [Op.like]: `%${term}%` } },
        { sku: { [Op.like]: `%${term}%` } },
      ];
    }

    if (category_id) {
      where.category_id = parseInt(category_id);
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    // tags param is a comma-separated list of tag IDs
    const tagIds = tags
      ? String(tags)
          .split(",")
          .map((t) => parseInt(t.trim()))
          .filter((t) => !isNaN(t))
      : null;

    const tagInclude = {
      model: Tag,
      as: "tags",
      attributes: ["id", "name"],
      through: { attributes: [] },
      ...(tagIds && tagIds.length > 0
        ? { where: { id: { [Op.in]: tagIds } }, required: true }
        : {}),
    };

    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
        tagInclude,
      ],
      limit: safeLimit,
      offset,
      order: [["name", "ASC"]],
      distinct: true,
    });

    // Attach rating stats in bulk
    const productIds = rows.map((r) => r.id);
    const statsMap = await _bulkReviewStats(productIds);

    const data = rows.map((row) => {
      const plain = row.toJSON();
      const stats = statsMap[plain.id] || { average: 0, count: 0 };
      plain.rating_average = stats.average;
      plain.rating_count = stats.count;
      return plain;
    });

    return {
      data,
      pagination: {
        total: count,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  },

  /**
   * Combined typeahead suggestions: matching products, categories, and tags.
   * Returns { products: [], categories: [], tags: [] }.
   */
  async searchSuggestions(query) {
    if (!query || !String(query).trim()) {
      return { products: [], categories: [], tags: [] };
    }

    const q = String(query).trim();

    const [products, categories, tags] = await Promise.all([
      Product.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${q}%` } },
            { brand: { [Op.like]: `%${q}%` } },
          ],
          status: "active",
        },
        attributes: ["id", "name", "brand", "price", "image_url"],
        limit: 5,
        order: [["name", "ASC"]],
      }),

      Category.findAll({
        where: { name: { [Op.like]: `%${q}%` } },
        attributes: ["id", "name"],
        limit: 5,
        order: [["name", "ASC"]],
      }),

      Tag.findAll({
        where: { name: { [Op.like]: `%${q}%` } },
        attributes: ["id", "name"],
        limit: 5,
        order: [["name", "ASC"]],
      }),
    ]);

    return {
      products: products.map((p) => p.toJSON()),
      categories: categories.map((c) => c.toJSON()),
      tags: tags.map((t) => t.toJSON()),
    };
  },
};

// ─── Internal helpers ────────────────────────────────────────────────────────

async function _bulkReviewStats(productIds) {
  if (!productIds || !productIds.length) return {};

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
}

module.exports = searchService;
