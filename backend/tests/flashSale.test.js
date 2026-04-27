const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Flash Sales API", () => {
  let flashSaleId;
  let activeFlashSaleId;

  const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const activeStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const activeEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // ─── CREATE ──────────────────────────────────────────────────────────────

  test("POST /api/flash-sales - 401 without token", async () => {
    const res = await request(app)
      .post("/api/flash-sales")
      .send({
        product_id: shared.productId,
        sale_price: 19.99,
        original_price: 29.99,
        discount_percentage: 33.37,
        start_time: futureStart,
        end_time: futureEnd,
      });
    expect(res.status).toBe(401);
  });

  test("POST /api/flash-sales - 403 for non-admin", async () => {
    const res = await request(app)
      .post("/api/flash-sales")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        product_id: shared.productId,
        sale_price: 19.99,
        original_price: 29.99,
        discount_percentage: 33.37,
        start_time: futureStart,
        end_time: futureEnd,
      });
    expect(res.status).toBe(403);
  });

  test("POST /api/flash-sales - admin creates a scheduled flash sale", async () => {
    const res = await request(app)
      .post("/api/flash-sales")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({
        product_id: shared.productId,
        sale_price: 19.99,
        original_price: 29.99,
        discount_percentage: 33.37,
        start_time: futureStart,
        end_time: futureEnd,
        stock_limit: 50,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product_id).toBe(shared.productId);
    expect(parseFloat(res.body.data.sale_price)).toBe(19.99);
    expect(res.body.data.stock_limit).toBe(50);
    flashSaleId = res.body.data.id;
  });

  test("POST /api/flash-sales - admin creates a currently active flash sale", async () => {
    const res = await request(app)
      .post("/api/flash-sales")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({
        product_id: shared.productId2,
        sale_price: 39.99,
        original_price: 59.99,
        discount_percentage: 33.34,
        start_time: activeStart,
        end_time: activeEnd,
        is_active: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    activeFlashSaleId = res.body.data.id;
  });

  // ─── LIST ────────────────────────────────────────────────────────────────

  test("GET /api/flash-sales - public lists all flash sales", async () => {
    const res = await request(app).get("/api/flash-sales");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination).toBeDefined();
    const item = res.body.data[0];
    expect(item.product).toBeDefined();
    expect(item.product.id).toBeDefined();
  });

  test("GET /api/flash-sales?active_only=true - returns only currently active sales", async () => {
    const res = await request(app).get("/api/flash-sales?active_only=true");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const now = Date.now();
    res.body.data.forEach((sale) => {
      expect(sale.is_active).toBe(true);
      expect(new Date(sale.start_time).getTime()).toBeLessThanOrEqual(now);
      expect(new Date(sale.end_time).getTime()).toBeGreaterThanOrEqual(now);
    });
    expect(res.body.data.some((s) => s.id === activeFlashSaleId)).toBe(true);
  });

  // ─── GET ACTIVE ──────────────────────────────────────────────────────────

  test("GET /api/flash-sales/active - returns all currently running sales", async () => {
    const res = await request(app).get("/api/flash-sales/active");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((s) => s.id === activeFlashSaleId)).toBe(true);
    const now = Date.now();
    res.body.data.forEach((sale) => {
      expect(sale.is_active).toBe(true);
      expect(new Date(sale.start_time).getTime()).toBeLessThanOrEqual(now);
      expect(new Date(sale.end_time).getTime()).toBeGreaterThanOrEqual(now);
      expect(sale.product).toBeDefined();
    });
  });

  // ─── GET BY ID ───────────────────────────────────────────────────────────

  test("GET /api/flash-sales/:id - public gets flash sale by id", async () => {
    const res = await request(app).get(`/api/flash-sales/${flashSaleId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(flashSaleId);
    expect(res.body.data.product).toBeDefined();
    expect(res.body.data.product.id).toBe(shared.productId);
  });

  test("GET /api/flash-sales/:id - 404 for missing id", async () => {
    const res = await request(app).get("/api/flash-sales/99999");
    expect(res.status).toBe(404);
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  test("PUT /api/flash-sales/:id - admin updates flash sale", async () => {
    const res = await request(app)
      .put(`/api/flash-sales/${flashSaleId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ sale_price: 17.99, stock_limit: 100 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(parseFloat(res.body.data.sale_price)).toBe(17.99);
    expect(res.body.data.stock_limit).toBe(100);
  });

  test("PUT /api/flash-sales/:id - 404 for missing id", async () => {
    const res = await request(app)
      .put("/api/flash-sales/99999")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ sale_price: 9.99 });
    expect(res.status).toBe(404);
  });

  test("PUT /api/flash-sales/:id - 403 for non-admin", async () => {
    const res = await request(app)
      .put(`/api/flash-sales/${flashSaleId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ sale_price: 9.99 });
    expect(res.status).toBe(403);
  });

  // ─── DELETE ──────────────────────────────────────────────────────────────

  test("DELETE /api/flash-sales/:id - 403 for non-admin", async () => {
    const res = await request(app)
      .delete(`/api/flash-sales/${flashSaleId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("DELETE /api/flash-sales/:id - admin deletes flash sale", async () => {
    const res = await request(app)
      .delete(`/api/flash-sales/${flashSaleId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test("DELETE /api/flash-sales/:id - 404 for missing id", async () => {
    const res = await request(app)
      .delete("/api/flash-sales/99999")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });

  test("GET /api/flash-sales/:id - 404 after deletion", async () => {
    const res = await request(app).get(`/api/flash-sales/${flashSaleId}`);
    expect(res.status).toBe(404);
  });
});
