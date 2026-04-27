const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Coupons API", () => {
  let couponId;
  let expiredCouponId;
  let maxedCouponId;
  let minOrderCouponId;

  // ─── CREATE ──────────────────────────────────────────────────────────────

  test("POST /api/coupons - 401 without token", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .send({ code: "NOAUTH", type: "fixed", value: 5 });
    expect(res.status).toBe(401);
  });

  test("POST /api/coupons - 403 for non-admin", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ code: "NOTADMIN", type: "fixed", value: 5 });
    expect(res.status).toBe(403);
  });

  test("POST /api/coupons - admin creates percentage coupon", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({
        code: "SAVE10",
        type: "percentage",
        value: 10,
        min_order_amount: 20,
        max_uses: 100,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe("SAVE10");
    expect(res.body.data.type).toBe("percentage");
    couponId = res.body.data.id;
  });

  test("POST /api/coupons - admin creates expired coupon", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({
        code: "EXPIRED10",
        type: "fixed",
        value: 10,
        expires_at: past,
      });
    expect(res.status).toBe(201);
    expiredCouponId = res.body.data.id;
  });

  test("POST /api/coupons - admin creates maxed-out coupon", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({
        code: "MAXEDOUT",
        type: "fixed",
        value: 5,
        max_uses: 1,
        used_count: 1,
      });
    expect(res.status).toBe(201);
    maxedCouponId = res.body.data.id;
  });

  test("POST /api/coupons - admin creates min-order coupon", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({
        code: "MINORDER",
        type: "fixed",
        value: 5,
        min_order_amount: 500,
      });
    expect(res.status).toBe(201);
    minOrderCouponId = res.body.data.id;
  });

  // ─── LIST ────────────────────────────────────────────────────────────────

  test("GET /api/coupons - 401 without token", async () => {
    const res = await request(app).get("/api/coupons");
    expect(res.status).toBe(401);
  });

  test("GET /api/coupons - admin lists all coupons", async () => {
    const res = await request(app)
      .get("/api/coupons")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(4);
  });

  test("GET /api/coupons - customer denied (403)", async () => {
    const res = await request(app)
      .get("/api/coupons")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  // ─── GET BY ID ───────────────────────────────────────────────────────────

  test("GET /api/coupons/:id - admin gets coupon by id", async () => {
    const res = await request(app)
      .get(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(couponId);
    expect(res.body.data.code).toBe("SAVE10");
  });

  test("GET /api/coupons/:id - 404 for missing id", async () => {
    const res = await request(app)
      .get("/api/coupons/99999")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });

  // ─── VALIDATE ────────────────────────────────────────────────────────────

  test("POST /api/coupons/validate - 401 without token", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "SAVE10", order_amount: 50 });
    expect(res.status).toBe(401);
  });

  test("POST /api/coupons/validate - valid code returns discount", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ code: "SAVE10", order_amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.discount).toBe(10);
    expect(res.body.data.finalAmount).toBe(90);
    expect(res.body.data.coupon).toBeDefined();
    expect(res.body.data.coupon.code).toBe("SAVE10");
  });

  test("POST /api/coupons/validate - expired code returns error", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ code: "EXPIRED10", order_amount: 50 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/expired/i);
  });

  test("POST /api/coupons/validate - max_uses exceeded returns error", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ code: "MAXEDOUT", order_amount: 50 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/limit/i);
  });

  test("POST /api/coupons/validate - min_order_amount not met returns error", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ code: "MINORDER", order_amount: 50 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/at least/i);
  });

  test("POST /api/coupons/validate - unknown code returns error", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ code: "DOESNOTEXIST", order_amount: 100 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  test("PUT /api/coupons/:id - admin updates coupon", async () => {
    const res = await request(app)
      .put(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ value: 15, max_uses: 200 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(parseFloat(res.body.data.value)).toBe(15);
    expect(res.body.data.max_uses).toBe(200);
  });

  test("PUT /api/coupons/:id - 404 for missing id", async () => {
    const res = await request(app)
      .put("/api/coupons/99999")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ value: 5 });
    expect(res.status).toBe(404);
  });

  test("PUT /api/coupons/:id - 403 for non-admin", async () => {
    const res = await request(app)
      .put(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ value: 5 });
    expect(res.status).toBe(403);
  });

  // ─── DELETE ──────────────────────────────────────────────────────────────

  test("DELETE /api/coupons/:id - 403 for non-admin", async () => {
    const res = await request(app)
      .delete(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("DELETE /api/coupons/:id - admin deletes coupon", async () => {
    const res = await request(app)
      .delete(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test("DELETE /api/coupons/:id - 404 for missing id", async () => {
    const res = await request(app)
      .delete("/api/coupons/99999")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });

  test("GET /api/coupons/:id - 404 after deletion", async () => {
    const res = await request(app)
      .get(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });
});
