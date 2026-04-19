const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Auth API", () => {
  test("POST /api/auth/register - validation error (empty fields)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "",
      email: "bad-email",
      password: "12",
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("POST /api/auth/register - duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Dup User",
      email: "admin@test.com",
      password: "password123",
    });
    expect(res.status).toBe(409);
  });

  test("POST /api/auth/login - valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "admin123",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("admin@test.com");
  });

  test("POST /api/auth/login - invalid password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "wrongpass",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/auth/login - non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: "whatever",
    });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login - validation error (empty fields)", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  test("GET /api/auth/profile - with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("admin@test.com");
    expect(res.body.data.password).toBeUndefined();
  });

  test("GET /api/auth/profile - no token", async () => {
    const res = await request(app).get("/api/auth/profile");
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/profile - invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});
