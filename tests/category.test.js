const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Categories API", () => {
  test("POST /api/categories - validation error (empty name)", async () => {
    const res = await request(app).post("/api/categories").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test("POST /api/categories - duplicate name", async () => {
    const res = await request(app).post("/api/categories").send({ name: "Electronics" });
    expect(res.status).toBe(409);
  });

  test("POST /api/categories - create second category", async () => {
    const res = await request(app).post("/api/categories").send({
      name: "Clothing",
      description: "Apparel and accessories",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Clothing");
  });

  test("GET /api/categories - list all", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test("GET /api/categories?search - search by name", async () => {
    const res = await request(app).get("/api/categories?search=elec");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Electronics");
  });

  test("GET /api/categories/:id - get by id", async () => {
    const res = await request(app).get(`/api/categories/${shared.categoryId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(shared.categoryId);
  });

  test("GET /api/categories/999 - not found", async () => {
    const res = await request(app).get("/api/categories/999");
    expect(res.status).toBe(404);
  });

  test("PUT /api/categories/:id - update", async () => {
    const res = await request(app)
      .put(`/api/categories/${shared.categoryId}`)
      .send({ name: "Electronics & Gadgets" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Electronics & Gadgets");
  });

  test("PUT /api/categories/999 - not found", async () => {
    const res = await request(app)
      .put("/api/categories/999")
      .send({ name: "Nothing" });
    expect(res.status).toBe(404);
  });

  test("DELETE /api/categories - delete second category", async () => {
    // Get the clothing category id
    const list = await request(app).get("/api/categories?search=Clothing");
    const clothingId = list.body.data[0].id;

    const res = await request(app).delete(`/api/categories/${clothingId}`);
    expect(res.status).toBe(200);
  });

  test("DELETE /api/categories/999 - not found", async () => {
    const res = await request(app).delete("/api/categories/999");
    expect(res.status).toBe(404);
  });
});
