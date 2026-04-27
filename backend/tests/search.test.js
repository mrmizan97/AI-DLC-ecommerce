const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

// NOTE: These routes are mounted in app.js by the developer after generation.
// The tests below use /api/search which maps to searchRoutes.js.

describe("Search API", () => {
  // ─── Autocomplete ─────────────────────────────────────────────────────────

  describe("GET /api/search/autocomplete", () => {
    test("returns matching products for a valid query", async () => {
      const res = await request(app).get("/api/search/autocomplete?q=mouse");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      // Each item should carry the lightweight projection fields
      const first = res.body.data[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("brand");
      expect(first).toHaveProperty("price");
    });

    test("returns empty array for empty query string", async () => {
      const res = await request(app).get("/api/search/autocomplete?q=");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    test("returns empty array when query matches nothing", async () => {
      const res = await request(app).get(
        "/api/search/autocomplete?q=zzznomatch99999"
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    test("respects the limit parameter", async () => {
      const res = await request(app).get(
        "/api/search/autocomplete?q=a&limit=1"
      );
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });

    test("returns category name in autocomplete result", async () => {
      const res = await request(app).get("/api/search/autocomplete?q=keyboard");
      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty("category");
      }
    });
  });

  // ─── Full search ──────────────────────────────────────────────────────────

  describe("GET /api/search", () => {
    test("returns paginated results with no filters", async () => {
      const res = await request(app).get("/api/search");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty("total");
      expect(res.body.pagination).toHaveProperty("page");
      expect(res.body.pagination).toHaveProperty("totalPages");
    });

    test("filters by query string", async () => {
      const res = await request(app).get("/api/search?q=mouse");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.every(
          (p) =>
            p.name.toLowerCase().includes("mouse") ||
            (p.brand && p.brand.toLowerCase().includes("mouse")) ||
            (p.sku && p.sku.toLowerCase().includes("mouse"))
        )
      ).toBe(true);
    });

    test("filters by category_id", async () => {
      const res = await request(app).get(
        `/api/search?category_id=${shared.categoryId}`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.every((p) => p.category && p.category.id === shared.categoryId)
      ).toBe(true);
    });

    test("filters by price range", async () => {
      const res = await request(app).get(
        "/api/search?min_price=50&max_price=100"
      );
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.every(
          (p) => parseFloat(p.price) >= 50 && parseFloat(p.price) <= 100
        )
      ).toBe(true);
    });

    test("returns rating info on each product", async () => {
      const res = await request(app).get("/api/search?q=mouse");
      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty("rating_average");
        expect(res.body.data[0]).toHaveProperty("rating_count");
      }
    });

    test("returns empty data for unmatched query", async () => {
      const res = await request(app).get(
        "/api/search?q=zzznomatch99999"
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    test("paginates results", async () => {
      const res = await request(app).get("/api/search?page=1&limit=1");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  // ─── Suggestions ─────────────────────────────────────────────────────────

  describe("GET /api/search/suggestions", () => {
    test("returns products, categories, and tags for a matching query", async () => {
      const res = await request(app).get(
        "/api/search/suggestions?q=electronics"
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("products");
      expect(res.body.data).toHaveProperty("categories");
      expect(res.body.data).toHaveProperty("tags");
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(Array.isArray(res.body.data.categories)).toBe(true);
      expect(Array.isArray(res.body.data.tags)).toBe(true);
      // "Electronics" is a seeded category — should match
      expect(res.body.data.categories.length).toBeGreaterThan(0);
    });

    test("categories are returned when category name matches", async () => {
      const res = await request(app).get(
        "/api/search/suggestions?q=Electron"
      );
      expect(res.status).toBe(200);
      expect(
        res.body.data.categories.some((c) =>
          c.name.toLowerCase().includes("electron")
        )
      ).toBe(true);
    });

    test("tags are returned when tag name matches", async () => {
      const res = await request(app).get(
        "/api/search/suggestions?q=wireless"
      );
      expect(res.status).toBe(200);
      expect(res.body.data.tags.length).toBeGreaterThan(0);
      expect(
        res.body.data.tags.some((t) =>
          t.name.toLowerCase().includes("wireless")
        )
      ).toBe(true);
    });

    test("returns empty buckets for empty query", async () => {
      const res = await request(app).get("/api/search/suggestions?q=");
      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual([]);
      expect(res.body.data.categories).toEqual([]);
      expect(res.body.data.tags).toEqual([]);
    });

    test("returns empty buckets when nothing matches", async () => {
      const res = await request(app).get(
        "/api/search/suggestions?q=zzznomatch99999"
      );
      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual([]);
      expect(res.body.data.categories).toEqual([]);
      expect(res.body.data.tags).toEqual([]);
    });
  });
});
