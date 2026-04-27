const { Product, Category, Tag, Media, Review } = require("../model");
const { fn, col } = require("sequelize");

const MIN_PRODUCTS = 2;
const MAX_PRODUCTS = 4;

const compareService = {
  /**
   * Fetch up to 4 products with full details and assemble a side-by-side
   * comparison object.
   *
   * @param {number[]} productIds - 2 to 4 unique product IDs
   * @returns {{ products: object[], comparison: object }}
   * @throws Error with a `statusCode` property for HTTP-level errors
   */
  async compareProducts(productIds) {
    // ── Validation ──────────────────────────────────────────────────────────
    if (!Array.isArray(productIds) || productIds.length === 0) {
      const err = new Error("product_ids must be a non-empty array");
      err.statusCode = 400;
      throw err;
    }

    const ids = productIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id) && id > 0);

    if (ids.length < MIN_PRODUCTS) {
      const err = new Error(
        `At least ${MIN_PRODUCTS} valid product IDs are required`
      );
      err.statusCode = 400;
      throw err;
    }

    if (ids.length > MAX_PRODUCTS) {
      const err = new Error(
        `At most ${MAX_PRODUCTS} products can be compared at once`
      );
      err.statusCode = 400;
      throw err;
    }

    // ── Fetch products ───────────────────────────────────────────────────────
    const products = await Product.findAll({
      where: { id: ids },
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        { model: Media, as: "media", required: false },
      ],
    });

    // Verify all requested products exist
    if (products.length !== ids.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      const err = new Error(
        `Products not found: ${missing.join(", ")}`
      );
      err.statusCode = 404;
      throw err;
    }

    // ── Attach review stats ──────────────────────────────────────────────────
    const statsMap = await _bulkReviewStats(ids);

    const enriched = products.map((p) => {
      const plain = p.toJSON();
      const stats = statsMap[plain.id] || { average: 0, count: 0 };
      plain.rating_average = stats.average;
      plain.rating_count = stats.count;
      return plain;
    });

    // Preserve the caller's requested order
    const ordered = ids.map((id) => enriched.find((p) => p.id === id));

    // ── Build comparison ─────────────────────────────────────────────────────
    const comparison = compareService.getComparisonAttributes(ordered);

    return { products: ordered, comparison };
  },

  /**
   * Extract comparable scalar attributes from a list of products and arrange
   * them as parallel arrays — one entry per product — so the frontend can
   * render a comparison table without additional processing.
   *
   * @param {object[]} products - Plain product objects (already enriched with
   *   rating_average / rating_count)
   * @returns {object} comparison map: { price, stock, brand, rating, category }
   */
  getComparisonAttributes(products) {
    return {
      price: products.map((p) => ({
        product_id: p.id,
        product_name: p.name,
        value: p.price !== null && p.price !== undefined ? parseFloat(p.price) : null,
      })),
      stock: products.map((p) => ({
        product_id: p.id,
        product_name: p.name,
        value: p.stock !== null && p.stock !== undefined ? parseInt(p.stock) : null,
      })),
      brand: products.map((p) => ({
        product_id: p.id,
        product_name: p.name,
        value: p.brand || null,
      })),
      rating: products.map((p) => ({
        product_id: p.id,
        product_name: p.name,
        average: p.rating_average,
        count: p.rating_count,
      })),
      category: products.map((p) => ({
        product_id: p.id,
        product_name: p.name,
        value: p.category ? p.category.name : null,
      })),
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

module.exports = compareService;
