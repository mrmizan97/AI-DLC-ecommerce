const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

let orderId;
let cancelOrderId;

describe("Orders API", () => {
  // ─── CREATE ──────────────────────────────────────────────────────────────

  test("POST /api/orders - place order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        shipping_address: "123 Main St, Dhaka",
        phone: "01712345678",
        note: "Deliver fast",
        items: [{ product_id: shared.productId, quantity: 2 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
    expect(parseFloat(res.body.data.total_amount)).toBe(79.98); // 39.99 * 2
    expect(res.body.data.items.length).toBe(1);
    orderId = res.body.data.id;
  });

  test("POST /api/orders - no token (401)", async () => {
    const res = await request(app).post("/api/orders").send({
      shipping_address: "123 St",
      phone: "017",
      items: [{ product_id: shared.productId, quantity: 1 }],
    });
    expect(res.status).toBe(401);
  });

  test("POST /api/orders - validation error", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ shipping_address: "", phone: "", items: [] });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("POST /api/orders - validation error (bad items)", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        shipping_address: "123 St",
        phone: "017",
        items: [{ product_id: -1, quantity: 0 }],
      });
    expect(res.status).toBe(400);
  });

  test("POST /api/orders - insufficient stock", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        shipping_address: "456 St",
        phone: "017",
        items: [{ product_id: shared.productId, quantity: 99999 }],
      });
    expect(res.status).toBe(500);
  });

  test("POST /api/orders - product not found", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        shipping_address: "456 St",
        phone: "017",
        items: [{ product_id: 9999, quantity: 1 }],
      });
    expect(res.status).toBe(500);
  });

  // ─── READ ────────────────────────────────────────────────────────────────

  test("GET /api/orders - customer sees own orders", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /api/orders - admin sees all orders", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/orders?status - filter by status", async () => {
    const res = await request(app)
      .get("/api/orders?status=pending")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((o) => o.status === "pending")).toBe(true);
  });

  test("GET /api/orders/:id - get order with includes", async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.items[0].product).toBeDefined();
  });

  test("GET /api/orders/999 - not found", async () => {
    const res = await request(app)
      .get("/api/orders/999")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(404);
  });

  // ─── STATUS UPDATE (Admin) ──────────────────────────────────────────────

  test("PATCH /api/orders/:id/status - admin updates to confirmed", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ status: "confirmed" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("confirmed");
  });

  test("PATCH /api/orders/:id/status - customer denied (403)", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ status: "shipped" });
    expect(res.status).toBe(403);
  });

  test("PATCH /api/orders/:id/status - validation error (invalid status)", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ status: "invalid" });
    expect(res.status).toBe(400);
  });

  // ─── CANCEL ──────────────────────────────────────────────────────────────

  test("PATCH /api/orders/:id/cancel - cannot cancel non-pending", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("pending");
  });

  test("POST /api/orders + CANCEL - cancel pending order restores stock", async () => {
    // Check stock before
    const beforeProd = await request(app).get(`/api/products/${shared.productId}`);
    const stockBefore = beforeProd.body.data.stock;

    // Place a new order
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        shipping_address: "789 Cancel St",
        phone: "01799999999",
        items: [{ product_id: shared.productId, quantity: 3 }],
      });
    expect(orderRes.status).toBe(201);
    cancelOrderId = orderRes.body.data.id;

    // Check stock decreased
    const afterOrder = await request(app).get(`/api/products/${shared.productId}`);
    expect(afterOrder.body.data.stock).toBe(stockBefore - 3);

    // Cancel the order
    const cancelRes = await request(app)
      .patch(`/api/orders/${cancelOrderId}/cancel`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("cancelled");

    // Check stock restored
    const afterCancel = await request(app).get(`/api/products/${shared.productId}`);
    expect(afterCancel.body.data.stock).toBe(stockBefore);
  });

  test("PATCH /api/orders/:id/status - cannot update cancelled order", async () => {
    const res = await request(app)
      .patch(`/api/orders/${cancelOrderId}/status`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ status: "confirmed" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("completed");
  });
});
