const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");
const lowStockService = require("../src/service/lowStockService");
const LowStockAlert = require("../src/model/LowStockAlert");

describe("Low Stock Alerts", () => {
  let alertId;

  // Clean up any alerts from previous runs to keep tests deterministic
  beforeAll(async () => {
    await LowStockAlert.destroy({ where: { product_id: shared.productId } });
  });

  // ─── SERVICE: check ───────────────────────────────────────────────────────

  test("check - creates alert when stock <= threshold (default 10)", async () => {
    const alert = await lowStockService.check(shared.productId, 5);
    expect(alert).not.toBeNull();
    expect(alert.id).toBeDefined();
    expect(alert.product_id).toBe(shared.productId);
    expect(alert.current_stock).toBe(5);
    expect(alert.threshold).toBe(10);
    expect(alert.resolved).toBe(false);
    alertId = alert.id;
  });

  test("check - does NOT create duplicate alert for same product when unresolved", async () => {
    const before = await LowStockAlert.count({ where: { product_id: shared.productId, resolved: false } });
    await lowStockService.check(shared.productId, 3);
    const after = await LowStockAlert.count({ where: { product_id: shared.productId, resolved: false } });
    expect(after).toBe(before); // no new record created
  });

  test("check - does NOT create alert when stock > threshold", async () => {
    const countBefore = await LowStockAlert.count({ where: { product_id: shared.productId2 } });
    const result = await lowStockService.check(shared.productId2, 100);
    const countAfter = await LowStockAlert.count({ where: { product_id: shared.productId2 } });
    expect(result).toBeNull();
    expect(countAfter).toBe(countBefore); // no new alert
  });

  test("check - creates alert at exactly the threshold boundary (stock === threshold)", async () => {
    // Use productId2 which has no unresolved alert yet
    await LowStockAlert.destroy({ where: { product_id: shared.productId2 } });
    const alert = await lowStockService.check(shared.productId2, 10, 10);
    expect(alert).not.toBeNull();
    expect(alert.current_stock).toBe(10);
  });

  // ─── SERVICE: getUnresolved ───────────────────────────────────────────────

  test("getUnresolved - returns unresolved alerts with product info", async () => {
    const alerts = await lowStockService.getUnresolved();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const found = alerts.find((a) => a.id === alertId);
    expect(found).toBeDefined();
    expect(found.product).toBeDefined();
    expect(found.resolved).toBe(false);
  });

  // ─── SERVICE: resolve ─────────────────────────────────────────────────────

  test("resolve - marks alert as resolved", async () => {
    const resolved = await lowStockService.resolve(alertId);
    expect(resolved).not.toBeNull();
    expect(resolved.resolved).toBe(true);
  });

  test("resolve - returns null for non-existent id", async () => {
    const result = await lowStockService.resolve(99999);
    expect(result).toBeNull();
  });

  // ─── SERVICE: findAll ─────────────────────────────────────────────────────

  test("findAll - returns paginated alerts", async () => {
    const result = await lowStockService.findAll({ page: 1, limit: 10 });
    expect(result.data).toBeDefined();
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });

  test("findAll - filters by resolved=true", async () => {
    const result = await lowStockService.findAll({ resolved: "true" });
    expect(result.data.every((a) => a.resolved === true)).toBe(true);
  });

  test("findAll - filters by resolved=false", async () => {
    const result = await lowStockService.findAll({ resolved: "false" });
    expect(result.data.every((a) => a.resolved === false)).toBe(true);
  });

  // ─── API: GET /api/low-stock (admin only) ─────────────────────────────────

  test("GET /api/low-stock - 401 without token", async () => {
    const res = await request(app).get("/api/low-stock");
    expect(res.status).toBe(401);
  });

  test("GET /api/low-stock - 403 for non-admin", async () => {
    const res = await request(app)
      .get("/api/low-stock")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/low-stock - admin lists alerts", async () => {
    const res = await request(app)
      .get("/api/low-stock")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /api/low-stock?resolved=true - filter by resolved", async () => {
    const res = await request(app)
      .get("/api/low-stock?resolved=true")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((a) => a.resolved === true)).toBe(true);
  });

  // ─── API: GET /api/low-stock/unresolved ───────────────────────────────────

  test("GET /api/low-stock/unresolved - 401 without token", async () => {
    const res = await request(app).get("/api/low-stock/unresolved");
    expect(res.status).toBe(401);
  });

  test("GET /api/low-stock/unresolved - admin gets unresolved alerts", async () => {
    const res = await request(app)
      .get("/api/low-stock/unresolved")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((a) => a.resolved === false)).toBe(true);
  });

  // ─── API: PATCH /api/low-stock/:id/resolve ────────────────────────────────

  test("PATCH /api/low-stock/:id/resolve - 401 without token", async () => {
    const res = await request(app).patch(`/api/low-stock/${alertId}/resolve`);
    expect(res.status).toBe(401);
  });

  test("PATCH /api/low-stock/:id/resolve - 403 for non-admin", async () => {
    const res = await request(app)
      .patch(`/api/low-stock/${alertId}/resolve`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("PATCH /api/low-stock/:id/resolve - admin resolves an alert", async () => {
    // Create a fresh alert to resolve via API
    await LowStockAlert.destroy({ where: { product_id: shared.productId } });
    const newAlert = await lowStockService.check(shared.productId, 2);
    expect(newAlert).not.toBeNull();

    const res = await request(app)
      .patch(`/api/low-stock/${newAlert.id}/resolve`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resolved).toBe(true);
  });

  test("PATCH /api/low-stock/99999/resolve - 404 for non-existent alert", async () => {
    const res = await request(app)
      .patch("/api/low-stock/99999/resolve")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
