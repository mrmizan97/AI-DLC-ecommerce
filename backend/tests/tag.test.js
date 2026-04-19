const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Tags API", () => {
  test("POST /api/tags - validation error (empty name)", async () => {
    const res = await request(app).post("/api/tags").send({ name: "" });
    expect(res.status).toBe(400);
  });

  test("POST /api/tags - duplicate name", async () => {
    const res = await request(app).post("/api/tags").send({ name: "wireless" });
    expect(res.status).toBe(409);
  });

  test("POST /api/tags - create third tag", async () => {
    const res = await request(app).post("/api/tags").send({ name: "budget" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("budget");
  });

  test("GET /api/tags - list all", async () => {
    const res = await request(app).get("/api/tags");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  test("GET /api/tags?search - search", async () => {
    const res = await request(app).get("/api/tags?search=wire");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test("GET /api/tags/:id - get by id", async () => {
    const res = await request(app).get(`/api/tags/${shared.tagId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(shared.tagId);
  });

  test("GET /api/tags/999 - not found", async () => {
    const res = await request(app).get("/api/tags/999");
    expect(res.status).toBe(404);
  });

  test("PUT /api/tags/:id - update", async () => {
    const res = await request(app)
      .put(`/api/tags/${shared.tagId}`)
      .send({ name: "bluetooth" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("bluetooth");
  });

  test("PUT /api/tags/999 - not found", async () => {
    const res = await request(app)
      .put("/api/tags/999")
      .send({ name: "ghost" });
    expect(res.status).toBe(404);
  });

  test("DELETE /api/tags - delete third tag", async () => {
    const list = await request(app).get("/api/tags?search=budget");
    const budgetId = list.body.data[0].id;

    const res = await request(app).delete(`/api/tags/${budgetId}`);
    expect(res.status).toBe(200);
  });

  test("DELETE /api/tags/999 - not found", async () => {
    const res = await request(app).delete("/api/tags/999");
    expect(res.status).toBe(404);
  });
});
