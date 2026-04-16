const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Users API", () => {
  test("GET /api/users - admin can list users", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /api/users - customer denied (403)", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/users - no token (401)", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  test("GET /api/users/:id - get user by id", async () => {
    const res = await request(app)
      .get(`/api/users/${shared.customerId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(shared.customerId);
    expect(res.body.data.password).toBeUndefined();
  });

  test("GET /api/users/999 - not found", async () => {
    const res = await request(app)
      .get("/api/users/999")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });

  test("PUT /api/users/:id - update user", async () => {
    const res = await request(app)
      .put(`/api/users/${shared.customerId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ name: "Updated Customer" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Customer");
  });

  test("PUT /api/users/:id - validation error (invalid role)", async () => {
    const res = await request(app)
      .put(`/api/users/${shared.customerId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .send({ role: "superadmin" });
    expect(res.status).toBe(400);
  });

  test("GET /api/users?search&role - filter", async () => {
    const res = await request(app)
      .get("/api/users?search=Updated&role=customer")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test("DELETE /api/users/:id - admin deletes user", async () => {
    // Create a temp user to delete
    const reg = await request(app).post("/api/auth/register").send({
      name: "Temp User",
      email: "temp@test.com",
      password: "temp123",
    });
    const tempId = reg.body.data.user.id;

    const res = await request(app)
      .delete(`/api/users/${tempId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);

    // Verify deleted
    const check = await request(app)
      .get(`/api/users/${tempId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(check.status).toBe(404);
  });
});
