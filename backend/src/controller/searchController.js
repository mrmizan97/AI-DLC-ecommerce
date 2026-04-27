const searchService = require("../service/searchService");

const searchController = {
  /**
   * GET /api/search/autocomplete?q=&limit=
   * Public. Fast name/brand/sku typeahead for search input fields.
   */
  async autocomplete(req, res, next) {
    try {
      const { q, limit } = req.query;

      if (!q || !String(q).trim()) {
        return res.json({ success: true, data: [] });
      }

      const data = await searchService.autocomplete(q, limit);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/search?q=&category_id=&min_price=&max_price=&tags=&page=&limit=
   * Public. Full filtered product search with pagination and rating info.
   */
  async search(req, res, next) {
    try {
      const result = await searchService.searchProducts(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/search/suggestions?q=
   * Public. Returns combined { products, categories, tags } for rich typeahead UIs.
   */
  async suggestions(req, res, next) {
    try {
      const { q } = req.query;

      if (!q || !String(q).trim()) {
        return res.json({
          success: true,
          data: { products: [], categories: [], tags: [] },
        });
      }

      const data = await searchService.searchSuggestions(q);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = searchController;
