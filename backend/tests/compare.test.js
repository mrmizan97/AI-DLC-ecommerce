const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

// NOTE: These routes are mounted in app.js by the developer after generation.
// The tests below use /api/compare which maps to compareRoutes.js.

describe("Compare API", () => {
  // ─── Success cases ────────────────────────────────────────────────────────

  test("POST /api/compare - compare 2 products returns 200 with comparison object", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [shared.productId, shared.productId2] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // products array
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(2);

    // comparison object with all expected attribute keys
    expect(res.body.comparison).toBeDefined();
    expect(res.body.comparison).toHaveProperty("price");
    expect(res.body.comparison).toHaveProperty("stock");
    expect(res.body.comparison).toHaveProperty("brand");
    expect(res.body.comparison).toHaveProperty("rating");
    expect(res.body.comparison).toHaveProperty("category");

    // Each comparison entry is an array with one item per product
    expect(res.body.comparison.price.length).toBe(2);
    expect(res.body.comparison.stock.length).toBe(2);
    expect(res.body.comparison.brand.length).toBe(2);
    expect(res.body.comparison.rating.length).toBe(2);
    expect(res.body.comparison.category.length).toBe(2);
  });

  test("POST /api/compare - comparison entries carry product_id and product_name", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [shared.productId, shared.productId2] });

    expect(res.status).toBe(200);
    const priceEntry = res.body.comparison.price[0];
    expect(priceEntry).toHaveProperty("product_id");
    expect(priceEntry).toHaveProperty("product_name");
    expect(priceEntry).toHaveProperty("value");
  });

  test("POST /api/compare - each product has rating_average and rating_count", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [shared.productId, shared.productId2] });

    expect(res.status).toBe(200);
    expect(res.body.products[0]).toHaveProperty("rating_average");
    expect(res.body.products[0]).toHaveProperty("rating_count");
  });

  test("POST /api/compare - each product includes category, tags, and media", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [shared.productId, shared.productId2] });

    expect(res.status).toBe(200);
    const product = res.body.products[0];
    expect(product).toHaveProperty("category");
    expect(product).toHaveProperty("tags");
    expect(product).toHaveProperty("media");
  });

  test("POST /api/compare - order of returned products matches requested order", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [shared.productId2, shared.productId] });

    expect(res.status).toBe(200);
    expect(res.body.products[0].id).toBe(shared.productId2);
    expect(res.body.products[1].id).toBe(shared.productId);
  });

  // ─── Validation errors ────────────────────────────────────────────────────

  test("POST /api/compare - missing product_ids → 400", async () => {
    const res = await request(app).post("/api/compare").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  test("POST /api/compare - product_ids not an array → 400", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: shared.productId });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/compare - only 1 product ID → 400", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [shared.productId] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/2/); // mentions the minimum
  });

  test("POST /api/compare - 5 product IDs → 400", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [1, 2, 3, 4, 5] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/4/); // mentions the maximum
  });

  test("POST /api/compare - empty array → 400", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ─── Not found errors ─────────────────────────────────────────────────────

  test("POST /api/compare - non-existent product IDs → 404", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [9998, 9999] });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  test("POST /api/compare - mix of valid and invalid IDs → 404", async () => {
    const res = await request(app)
      .post("/api/compare")
      .send({ product_ids: [shared.productId, 9999] });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
