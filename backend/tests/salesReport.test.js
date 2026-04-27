const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Sales Report API", () => {
  // ─── AUTH GUARD ──────────────────────────────────────────────────────────

  test("GET /api/reports/summary - no token (401)", async () => {
    const res = await request(app).get("/api/reports/summary");
    expect(res.status).toBe(401);
  });

  test("GET /api/reports/summary - customer forbidden (403)", async () => {
    const res = await request(app)
      .get("/api/reports/summary")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/reports/top-products - no token (401)", async () => {
    const res = await request(app).get("/api/reports/top-products");
    expect(res.status).toBe(401);
  });

  test("GET /api/reports/top-customers - no token (401)", async () => {
    const res = await request(app).get("/api/reports/top-customers");
    expect(res.status).toBe(401);
  });

  // ─── SUMMARY ─────────────────────────────────────────────────────────────

  test("GET /api/reports/summary - returns summary data (200)", async () => {
    const res = await request(app)
      .get("/api/reports/summary")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.totals).toBeDefined();
    expect(res.body.data.totals.total_orders).toBeDefined();
    expect(res.body.data.totals.total_revenue).toBeDefined();
    expect(res.body.data.totals.avg_order_value).toBeDefined();
    expect(res.body.data.periods).toBeDefined();
    expect(Array.isArray(res.body.data.periods)).toBe(true);
  });

  test("GET /api/reports/summary?group_by=month - grouped by month", async () => {
    const res = await request(app)
      .get("/api/reports/summary?group_by=month")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.group_by).toBe("month");
  });

  test("GET /api/reports/summary?group_by=week - grouped by week", async () => {
    const res = await request(app)
      .get("/api/reports/summary?group_by=week")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.group_by).toBe("week");
  });

  test("GET /api/reports/summary?start_date&end_date - date filtered", async () => {
    const res = await request(app)
      .get("/api/reports/summary?start_date=2020-01-01&end_date=2099-12-31")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe("2020-01-01");
    expect(res.body.data.end_date).toBe("2099-12-31");
  });

  // ─── TOP PRODUCTS ─────────────────────────────────────────────────────────

  test("GET /api/reports/top-products - returns array (200)", async () => {
    const res = await request(app)
      .get("/api/reports/top-products")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/reports/top-products?limit=5 - respects limit", async () => {
    const res = await request(app)
      .get("/api/reports/top-products?limit=5")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/reports/top-products - customer forbidden (403)", async () => {
    const res = await request(app)
      .get("/api/reports/top-products")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  // ─── TOP CUSTOMERS ────────────────────────────────────────────────────────

  test("GET /api/reports/top-customers - returns array (200)", async () => {
    const res = await request(app)
      .get("/api/reports/top-customers")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/reports/top-customers?limit=3 - respects limit", async () => {
    const res = await request(app)
      .get("/api/reports/top-customers?limit=3")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
  });

  test("GET /api/reports/top-customers - customer forbidden (403)", async () => {
    const res = await request(app)
      .get("/api/reports/top-customers")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  // ─── EXPORT CSV ──────────────────────────────────────────────────────────

  test("GET /api/reports/export/csv - no token (401)", async () => {
    const res = await request(app).get("/api/reports/export/csv");
    expect(res.status).toBe(401);
  });

  test("GET /api/reports/export/csv - returns CSV file (200)", async () => {
    const res = await request(app)
      .get("/api/reports/export/csv")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(res.headers["content-disposition"]).toMatch(/sales_report/);
    expect(res.text).toContain("SALES SUMMARY");
  });

  test("GET /api/reports/export/csv - customer forbidden (403)", async () => {
    const res = await request(app)
      .get("/api/reports/export/csv")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  // ─── EXPORT JSON ─────────────────────────────────────────────────────────

  test("GET /api/reports/export/json - no token (401)", async () => {
    const res = await request(app).get("/api/reports/export/json");
    expect(res.status).toBe(401);
  });

  test("GET /api/reports/export/json - returns JSON report (200)", async () => {
    const res = await request(app)
      .get("/api/reports/export/json")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.topProducts).toBeDefined();
    expect(res.body.data.topCustomers).toBeDefined();
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
  });

  test("GET /api/reports/export/json - customer forbidden (403)", async () => {
    const res = await request(app)
      .get("/api/reports/export/json")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });
});
