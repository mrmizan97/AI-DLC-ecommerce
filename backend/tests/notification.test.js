const request = require("supertest");
const app = require("../src/app");
const notificationService = require("../src/service/notificationService");
const shared = require("./shared");

describe("Notifications API", () => {
  let n1, n2, n3;

  beforeAll(async () => {
    n1 = await notificationService.createForUser(shared.customerId, {
      type: "info",
      message: "First test notification",
    });
    n2 = await notificationService.createForUser(shared.customerId, {
      type: "order",
      message: "Second test notification",
    });
    n3 = await notificationService.createForUser(shared.customerId, {
      type: "info",
      message: "Third test notification",
    });
  });

  test("GET /api/notifications - 401 without token", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  test("GET /api/notifications - lists current user notifications", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.data.every((n) => n.user_id === shared.customerId)).toBe(true);
  });

  test("GET /api/notifications - other user cannot see these", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((n) => n.user_id !== shared.customerId)).toBe(true);
  });

  test("GET /api/notifications/unread-count - returns count", async () => {
    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBeGreaterThanOrEqual(3);
  });

  test("PATCH /api/notifications/:id/read - marks one read", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${n1.id}/read`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.read).toBe(true);
  });

  test("PATCH /api/notifications/:id/read - 404 when not owner", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${n2.id}/read`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });

  test("GET /api/notifications?unread_only=true - filters", async () => {
    const res = await request(app)
      .get("/api/notifications?unread_only=true")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((n) => n.read === false)).toBe(true);
  });

  test("PATCH /api/notifications/read-all - marks all read", async () => {
    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);

    const c = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(c.body.data.count).toBe(0);
  });

  test("DELETE /api/notifications/:id - removes one", async () => {
    const res = await request(app)
      .delete(`/api/notifications/${n3.id}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
  });

  test("DELETE /api/notifications/:id - 404 for missing", async () => {
    const res = await request(app)
      .delete(`/api/notifications/99999`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(404);
  });

  test("DELETE /api/notifications/all - clears remaining", async () => {
    const res = await request(app)
      .delete(`/api/notifications/all`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);

    const list = await request(app)
      .get(`/api/notifications`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(list.body.data.length).toBe(0);
  });
});
