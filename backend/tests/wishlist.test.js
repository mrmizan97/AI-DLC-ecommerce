const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Wishlist API", () => {
  // ─── ADD ─────────────────────────────────────────────────────────────────

  test("POST /api/wishlist - 401 without token", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .send({ product_id: shared.productId });
    expect(res.status).toBe(401);
  });

  test("POST /api/wishlist - add item to wishlist", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ product_id: shared.productId });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product_id).toBe(shared.productId);
    expect(res.body.data.user_id).toBe(shared.customerId);
  });

  test("POST /api/wishlist - duplicate add returns 409", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ product_id: shared.productId });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // ─── LIST ────────────────────────────────────────────────────────────────

  test("GET /api/wishlist - list wishlist has 1 item", async () => {
    const res = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].product).toBeDefined();
    expect(res.body.data[0].product.id).toBe(shared.productId);
  });

  // ─── CHECK ───────────────────────────────────────────────────────────────

  test("GET /api/wishlist/:productId/check - wishlisted=true", async () => {
    const res = await request(app)
      .get(`/api/wishlist/${shared.productId}/check`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.wishlisted).toBe(true);
  });

  // ─── REMOVE ──────────────────────────────────────────────────────────────

  test("DELETE /api/wishlist/:productId - remove item", async () => {
    const res = await request(app)
      .delete(`/api/wishlist/${shared.productId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("DELETE /api/wishlist/:productId - 404 when already removed", async () => {
    const res = await request(app)
      .delete(`/api/wishlist/${shared.productId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(404);
  });

  // ─── CHECK AFTER REMOVE ──────────────────────────────────────────────────

  test("GET /api/wishlist/:productId/check - wishlisted=false after removal", async () => {
    const res = await request(app)
      .get(`/api/wishlist/${shared.productId}/check`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.wishlisted).toBe(false);
  });

  // ─── LIST EMPTY ──────────────────────────────────────────────────────────

  test("GET /api/wishlist - empty list after removal", async () => {
    const res = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});
