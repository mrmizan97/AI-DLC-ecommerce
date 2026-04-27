const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Address Book API", () => {
  let addressId;
  let address2Id;

  // ─── CREATE ──────────────────────────────────────────────────────────────

  test("POST /api/addresses - 401 without token", async () => {
    const res = await request(app)
      .post("/api/addresses")
      .send({ recipient_name: "Test", address_line: "123 St", city: "Dhaka" });
    expect(res.status).toBe(401);
  });

  test("POST /api/addresses - create first address (non-default)", async () => {
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        label: "Home",
        recipient_name: "Customer User",
        phone: "01700000001",
        address_line: "123 Main Street",
        city: "Dhaka",
        state: "Dhaka Division",
        postal_code: "1200",
        country: "Bangladesh",
        is_default: false,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.label).toBe("Home");
    expect(res.body.data.city).toBe("Dhaka");
    expect(res.body.data.is_default).toBe(false);
    addressId = res.body.data.id;
  });

  test("POST /api/addresses - create second address as default", async () => {
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        label: "Work",
        recipient_name: "Customer Work",
        phone: "01700000002",
        address_line: "456 Office Road",
        city: "Chittagong",
        state: "Chittagong Division",
        postal_code: "4000",
        country: "Bangladesh",
        is_default: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_default).toBe(true);
    address2Id = res.body.data.id;
  });

  // ─── LIST ────────────────────────────────────────────────────────────────

  test("GET /api/addresses - list has 2 addresses", async () => {
    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  // ─── GET BY ID ───────────────────────────────────────────────────────────

  test("GET /api/addresses/:id - get by id", async () => {
    const res = await request(app)
      .get(`/api/addresses/${addressId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(addressId);
    expect(res.body.data.label).toBe("Home");
  });

  test("GET /api/addresses/:id - 404 for another user's address", async () => {
    const res = await request(app)
      .get(`/api/addresses/${addressId}`)
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(404);
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  test("PUT /api/addresses/:id - update address", async () => {
    const res = await request(app)
      .put(`/api/addresses/${addressId}`)
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        label: "Home Updated",
        recipient_name: "Customer User Updated",
        phone: "01700000099",
        address_line: "123 Main Street Updated",
        city: "Sylhet",
        state: "Sylhet Division",
        postal_code: "3100",
        country: "Bangladesh",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.label).toBe("Home Updated");
    expect(res.body.data.city).toBe("Sylhet");
  });

  test("PUT /api/addresses/99999 - 404 for missing address", async () => {
    const res = await request(app)
      .put("/api/addresses/99999")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .send({
        recipient_name: "Ghost",
        address_line: "Nowhere",
        city: "Nowhere City",
      });
    expect(res.status).toBe(404);
  });

  // ─── SET DEFAULT ─────────────────────────────────────────────────────────

  test("PATCH /api/addresses/:id/default - set first address as default", async () => {
    const res = await request(app)
      .patch(`/api/addresses/${addressId}/default`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_default).toBe(true);
  });

  test("GET /api/addresses - verify only one default after setDefault", async () => {
    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    const defaults = res.body.data.filter((a) => a.is_default === true);
    expect(defaults.length).toBe(1);
    expect(defaults[0].id).toBe(addressId);
  });

  // ─── DELETE ──────────────────────────────────────────────────────────────

  test("DELETE /api/addresses/:id - delete second address", async () => {
    const res = await request(app)
      .delete(`/api/addresses/${address2Id}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/addresses/:id - 404 after deletion", async () => {
    const res = await request(app)
      .get(`/api/addresses/${address2Id}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(404);
  });

  test("DELETE /api/addresses/:id - 404 for already deleted", async () => {
    const res = await request(app)
      .delete(`/api/addresses/${address2Id}`)
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(404);
  });
});
