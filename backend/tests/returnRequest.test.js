const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");
const { Order } = require("../src/model");

describe("Return Requests API", () => {
  let pendingOrderId;
  let deliveredOrderId;
  let returnRequestId;

  beforeAll(async () => {
    // Create a pending order for the customer
    const pendingRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        shipping_address: "10 Return St, Dhaka",
        phone: "01711111111",
        items: [{ product_id: shared.productId, quantity: 1 }],
      });
    pendingOrderId = pendingRes.body.data.id;

    // Create another order and force its status to 'delivered' directly via DB
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        shipping_address: "20 Delivered Ave, Dhaka",
        phone: "01711111112",
        items: [{ product_id: shared.productId2, quantity: 1 }],
      });
    deliveredOrderId = orderRes.body.data.id;

    // Update the order status to delivered directly
    await Order.update({ status: "delivered" }, { where: { id: deliveredOrderId } });
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────

  test("POST /api/returns - 401 without token", async () => {
    const res = await request(app)
      .post("/api/returns")
      .send({ order_id: deliveredOrderId, reason: "Damaged product" });
    expect(res.status).toBe(401);
  });

  test("POST /api/returns - 400 for non-delivered order", async () => {
    const res = await request(app)
      .post("/api/returns")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ order_id: pendingOrderId, reason: "Changed my mind" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/delivered/i);
  });

  test("POST /api/returns - 400 if order does not belong to user", async () => {
    // Admin tries to return customer's order using customer's order id
    const res = await request(app)
      .post("/api/returns")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ order_id: deliveredOrderId, reason: "Wrong item" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/returns - customer creates return for delivered order", async () => {
    const res = await request(app)
      .post("/api/returns")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ order_id: deliveredOrderId, reason: "Item was defective" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.reason).toBe("Item was defective");
    expect(res.body.data.order).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    returnRequestId = res.body.data.id;
  });

  test("POST /api/returns - 400 duplicate return request for same order", async () => {
    const res = await request(app)
      .post("/api/returns")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ order_id: deliveredOrderId, reason: "Trying again" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already/i);
  });

  // ─── READ (Admin) ─────────────────────────────────────────────────────────

  test("GET /api/returns - 403 for non-admin", async () => {
    const res = await request(app)
      .get("/api/returns")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/returns - admin lists all return requests", async () => {
    const res = await request(app)
      .get("/api/returns")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.data[0].order).toBeDefined();
    expect(res.body.data[0].user).toBeDefined();
  });

  test("GET /api/returns?status=pending - admin filters by status", async () => {
    const res = await request(app)
      .get("/api/returns?status=pending")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((r) => r.status === "pending")).toBe(true);
  });

  // ─── READ (User: /mine) ───────────────────────────────────────────────────

  test("GET /api/returns/mine - 401 without token", async () => {
    const res = await request(app).get("/api/returns/mine");
    expect(res.status).toBe(401);
  });

  test("GET /api/returns/mine - customer gets own return requests", async () => {
    const res = await request(app)
      .get("/api/returns/mine")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.data.every((r) => r.user_id === shared.customerId)).toBe(true);
  });

  // ─── READ (Single) ────────────────────────────────────────────────────────

  test("GET /api/returns/:id - 404 for missing id", async () => {
    const res = await request(app)
      .get("/api/returns/99999")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });

  test("GET /api/returns/:id - owner can view own request", async () => {
    const res = await request(app)
      .get(`/api/returns/${returnRequestId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(returnRequestId);
  });

  test("GET /api/returns/:id - admin can view any request", async () => {
    const res = await request(app)
      .get(`/api/returns/${returnRequestId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(returnRequestId);
  });

  // ─── UPDATE STATUS (Admin) ────────────────────────────────────────────────

  test("PUT /api/returns/:id - 403 for non-admin", async () => {
    const res = await request(app)
      .put(`/api/returns/${returnRequestId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(403);
  });

  test("PUT /api/returns/:id - admin approves return request", async () => {
    const res = await request(app)
      .put(`/api/returns/${returnRequestId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ status: "approved", admin_note: "Approved after review", refund_amount: 29.99 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("approved");
    expect(res.body.data.admin_note).toBe("Approved after review");
    expect(parseFloat(res.body.data.refund_amount)).toBe(29.99);
  });

  test("PUT /api/returns/:id - admin marks as refunded", async () => {
    const res = await request(app)
      .put(`/api/returns/${returnRequestId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ status: "refunded" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("refunded");
  });

  test("PUT /api/returns/99999 - 404 for missing return request", async () => {
    const res = await request(app)
      .put("/api/returns/99999")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ status: "rejected" });
    expect(res.status).toBe(404);
  });
});
