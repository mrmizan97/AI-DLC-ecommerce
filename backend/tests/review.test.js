const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Reviews API", () => {
  let reviewId;

  // ─── CREATE ──────────────────────────────────────────────────────────────

  test("POST /api/products/:id/reviews - 401 without token", async () => {
    const res = await request(app)
      .post(`/api/products/${shared.productId}/reviews`)
      .send({ rating: 5, comment: "Great" });
    expect(res.status).toBe(401);
  });

  test("POST /api/products/:id/reviews - 400 without rating", async () => {
    const res = await request(app)
      .post(`/api/products/${shared.productId}/reviews`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ comment: "nice" });
    expect(res.status).toBe(400);
  });

  test("POST /api/products/:id/reviews - 400 for out-of-range rating", async () => {
    const res = await request(app)
      .post(`/api/products/${shared.productId}/reviews`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ rating: 7, comment: "too high" });
    expect(res.status).toBe(400);
  });

  test("POST /api/products/:id/reviews - 404 when product missing", async () => {
    const res = await request(app)
      .post(`/api/products/99999/reviews`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ rating: 4, comment: "ghost" });
    expect(res.status).toBe(404);
  });

  test("POST /api/products/:id/reviews - customer creates review", async () => {
    const res = await request(app)
      .post(`/api/products/${shared.productId}/reviews`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ rating: 5, comment: "Excellent product" });
    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(shared.customerId);
    reviewId = res.body.data.id;
  });

  test("POST /api/products/:id/reviews - duplicate review rejected", async () => {
    const res = await request(app)
      .post(`/api/products/${shared.productId}/reviews`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ rating: 4, comment: "again" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  test("POST /api/products/:id/reviews - admin adds a second review", async () => {
    const res = await request(app)
      .post(`/api/products/${shared.productId}/reviews`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ rating: 3, comment: "average" });
    expect(res.status).toBe(201);
  });

  // ─── READ ────────────────────────────────────────────────────────────────

  test("GET /api/products/:id/reviews - public list with stats", async () => {
    const res = await request(app).get(`/api/products/${shared.productId}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.count).toBe(2);
    expect(res.body.stats.average).toBe(4);
  });

  test("GET /api/products/:id - product exposes rating_average & rating_count", async () => {
    const res = await request(app).get(`/api/products/${shared.productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.rating_count).toBe(2);
    expect(res.body.data.rating_average).toBe(4);
  });

  test("GET /api/products - list products include rating stats", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    const found = res.body.data.find((p) => p.id === shared.productId);
    expect(found.rating_count).toBe(2);
    expect(found.rating_average).toBe(4);
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  test("PUT /api/reviews/:id - owner updates rating", async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ rating: 4, comment: "Updated text" });
    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(4);
    expect(res.body.data.comment).toBe("Updated text");
  });

  test("PUT /api/reviews/:id - 400 invalid rating", async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({ rating: 99 });
    expect(res.status).toBe(400);
  });

  test("PUT /api/reviews/:id - non-owner customer denied (403) only if another customer", async () => {
    // Create a second customer
    const reg = await request(app).post("/api/auth/register").send({
      name: "Other Customer",
      email: "other@test.com",
      password: "other123",
    });
    const otherToken = reg.body.data.token;
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ rating: 1 });
    expect(res.status).toBe(403);
  });

  test("PUT /api/reviews/:id - admin can update any review", async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ comment: "Moderated by admin" });
    expect(res.status).toBe(200);
    expect(res.body.data.comment).toBe("Moderated by admin");
  });

  // ─── ADMIN LIST ──────────────────────────────────────────────────────────

  test("GET /api/reviews - admin lists all reviews", async () => {
    const res = await request(app)
      .get("/api/reviews")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /api/reviews - customer denied (403)", async () => {
    const res = await request(app)
      .get("/api/reviews")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/reviews?min_rating=4 - filter", async () => {
    const res = await request(app)
      .get("/api/reviews?min_rating=4")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((r) => r.rating >= 4)).toBe(true);
  });

  // ─── DELETE ──────────────────────────────────────────────────────────────

  test("DELETE /api/reviews/:id - 404 for missing id", async () => {
    const res = await request(app)
      .delete(`/api/reviews/99999`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(404);
  });

  test("DELETE /api/reviews/:id - owner deletes own review", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
  });

  test("GET /api/products/:id/reviews - stats reflect deletion", async () => {
    const res = await request(app).get(`/api/products/${shared.productId}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.stats.count).toBe(1);
    expect(res.body.stats.average).toBe(3);
  });
});
