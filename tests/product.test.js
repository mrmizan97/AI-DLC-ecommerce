const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Products API", () => {
  // ─── CREATE ──────────────────────────────────────────────────────────────

  test("POST /api/products - validation error", async () => {
    const res = await request(app).post("/api/products").send({
      name: "",
      price: -5,
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("POST /api/products - duplicate sku", async () => {
    const res = await request(app).post("/api/products").send({
      name: "Dup Product",
      price: 10,
      stock: 5,
      category_id: shared.categoryId,
      sku: "WM-001",
    });
    expect(res.status).toBe(409);
  });

  // ─── READ ────────────────────────────────────────────────────────────────

  test("GET /api/products - list all with pagination", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(2);
  });

  test("GET /api/products?search - search by name", async () => {
    const res = await request(app).get("/api/products?search=mouse");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Wireless Mouse");
  });

  test("GET /api/products?category_id - filter by category", async () => {
    const res = await request(app).get(`/api/products?category_id=${shared.categoryId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test("GET /api/products?min_price&max_price - price range", async () => {
    const res = await request(app).get("/api/products?min_price=50&max_price=100");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("USB Keyboard");
  });

  test("GET /api/products?sort_by=price&sort_order=ASC - sort", async () => {
    const res = await request(app).get("/api/products?sort_by=price&sort_order=ASC");
    expect(res.status).toBe(200);
    const prices = res.body.data.map((p) => parseFloat(p.price));
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
  });

  test("GET /api/products?page&limit - pagination", async () => {
    const res = await request(app).get("/api/products?page=1&limit=1");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  test("GET /api/products/:id - get by id with includes", async () => {
    const res = await request(app).get(`/api/products/${shared.productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.category).toBeDefined();
    expect(res.body.data.tags).toBeDefined();
    expect(res.body.data.category.id).toBe(shared.categoryId);
  });

  test("GET /api/products/999 - not found", async () => {
    const res = await request(app).get("/api/products/999");
    expect(res.status).toBe(404);
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  test("PUT /api/products/:id - update product", async () => {
    const res = await request(app)
      .put(`/api/products/${shared.productId}`)
      .send({
        name: "Wireless Mouse Pro",
        price: 39.99,
        stock: 80,
        category_id: shared.categoryId,
        sku: "WM-001",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Wireless Mouse Pro");
  });

  test("PUT /api/products/999 - not found", async () => {
    const res = await request(app)
      .put("/api/products/999")
      .send({
        name: "Ghost",
        price: 10,
        category_id: shared.categoryId,
        sku: "GHOST-001",
      });
    expect(res.status).toBe(404);
  });

  // ─── TAGS ────────────────────────────────────────────────────────────────

  test("POST /api/products/:id/tags - add tags", async () => {
    const res = await request(app)
      .post(`/api/products/${shared.productId}/tags`)
      .send({ tag_ids: [shared.tagId, shared.tagId2] });
    expect(res.status).toBe(200);
    expect(res.body.data.tags.length).toBe(2);
  });

  test("DELETE /api/products/:id/tags - remove one tag", async () => {
    const res = await request(app)
      .delete(`/api/products/${shared.productId}/tags`)
      .send({ tag_ids: [shared.tagId2] });
    expect(res.status).toBe(200);
    expect(res.body.data.tags.length).toBe(1);
  });

  test("GET /api/products?tag - filter by tag name", async () => {
    const res = await request(app).get("/api/products?tag=bluetooth");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
