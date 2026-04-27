const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");
const activityLogService = require("../src/service/activityLogService");

describe("Activity Logs API", () => {
  let logId1;
  let logId2;

  beforeAll(async () => {
    // Create activity logs directly via service
    const log1 = await activityLogService.log({
      user_id: shared.customerId,
      action: "product.view",
      entity_type: "Product",
      entity_id: shared.productId,
      description: "Customer viewed a product",
      ip_address: "127.0.0.1",
      metadata: { source: "web" },
    });
    logId1 = log1.id;

    const log2 = await activityLogService.log({
      user_id: shared.adminId,
      action: "order.status_update",
      entity_type: "Order",
      entity_id: 1,
      description: "Admin updated order status",
      ip_address: "127.0.0.1",
    });
    logId2 = log2.id;

    // System action (no user)
    await activityLogService.log({
      user_id: null,
      action: "system.cleanup",
      description: "Scheduled cleanup task ran",
    });
  });

  // ─── SERVICE DIRECT ───────────────────────────────────────────────────────

  test("activityLogService.log - creates a log entry", async () => {
    const log = await activityLogService.log({
      user_id: shared.customerId,
      action: "user.login",
      entity_type: "User",
      entity_id: shared.customerId,
      description: "Customer logged in",
      ip_address: "192.168.1.1",
      metadata: { browser: "Chrome" },
    });
    expect(log).toBeDefined();
    expect(log.id).toBeDefined();
    expect(log.action).toBe("user.login");
    expect(log.user_id).toBe(shared.customerId);
    expect(log.metadata).toBeDefined();
    expect(log.metadata.browser).toBe("Chrome");
  });

  test("activityLogService.log - creates system log with null user_id", async () => {
    const log = await activityLogService.log({
      action: "system.init",
      description: "System initialized",
    });
    expect(log).toBeDefined();
    expect(log.user_id).toBeNull();
    expect(log.action).toBe("system.init");
  });

  test("activityLogService.findById - returns single log with user", async () => {
    const log = await activityLogService.findById(logId1);
    expect(log).toBeDefined();
    expect(log.id).toBe(logId1);
    expect(log.action).toBe("product.view");
    expect(log.user).toBeDefined();
    expect(log.user.id).toBe(shared.customerId);
  });

  // ─── ADMIN LIST ───────────────────────────────────────────────────────────

  test("GET /api/activity-logs - 401 without token", async () => {
    const res = await request(app).get("/api/activity-logs");
    expect(res.status).toBe(401);
  });

  test("GET /api/activity-logs - 403 for non-admin", async () => {
    const res = await request(app)
      .get("/api/activity-logs")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/activity-logs - admin lists all logs", async () => {
    const res = await request(app)
      .get("/api/activity-logs")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /api/activity-logs?action=product.view - filter by action", async () => {
    const res = await request(app)
      .get("/api/activity-logs?action=product.view")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((l) => l.action.includes("product.view"))).toBe(true);
  });

  test("GET /api/activity-logs?user_id= - filter by user_id", async () => {
    const res = await request(app)
      .get(`/api/activity-logs?user_id=${shared.customerId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((l) => l.user_id === shared.customerId)).toBe(true);
  });

  test("GET /api/activity-logs?entity_type=Order - filter by entity_type", async () => {
    const res = await request(app)
      .get("/api/activity-logs?entity_type=Order")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((l) => l.entity_type === "Order")).toBe(true);
  });

  test("GET /api/activity-logs - pagination works", async () => {
    const res = await request(app)
      .get("/api/activity-logs?page=1&limit=2")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.page).toBe(1);
  });

  // ─── USER OWN LOGS (/mine) ────────────────────────────────────────────────

  test("GET /api/activity-logs/mine - 401 without token", async () => {
    const res = await request(app).get("/api/activity-logs/mine");
    expect(res.status).toBe(401);
  });

  test("GET /api/activity-logs/mine - customer sees own logs", async () => {
    const res = await request(app)
      .get("/api/activity-logs/mine")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((l) => l.user_id === shared.customerId)).toBe(true);
  });

  test("GET /api/activity-logs/mine - admin sees own logs", async () => {
    const res = await request(app)
      .get("/api/activity-logs/mine")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((l) => l.user_id === shared.adminId)).toBe(true);
  });
});
