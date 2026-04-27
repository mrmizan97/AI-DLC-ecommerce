const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("Bulk Import API", () => {
  // ─── TEMPLATE DOWNLOAD ───────────────────────────────────────────────────

  test("GET /api/bulk-import/template - unauthorized (no token)", async () => {
    const res = await request(app).get("/api/bulk-import/template");
    expect(res.status).toBe(401);
  });

  test("GET /api/bulk-import/template - forbidden for non-admin", async () => {
    const res = await request(app)
      .get("/api/bulk-import/template")
      .set("Authorization", `Bearer ${shared.customerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /api/bulk-import/template - returns CSV template (200)", async () => {
    const res = await request(app)
      .get("/api/bulk-import/template")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(res.headers["content-disposition"]).toMatch(/product_template\.csv/);
    expect(res.text).toContain("name");
    expect(res.text).toContain("price");
    expect(res.text).toContain("sku");
  });

  // ─── IMPORT ──────────────────────────────────────────────────────────────

  test("POST /api/bulk-import/import - unauthorized (no token)", async () => {
    const csvContent = `name,description,price,stock,category_id,brand,sku,image_url,status\nTest,Desc,10,5,${shared.categoryId},Brand,UNAUTH-001,,active`;
    const res = await request(app)
      .post("/api/bulk-import/import")
      .attach("file", Buffer.from(csvContent), { filename: "products.csv", contentType: "text/csv" });
    expect(res.status).toBe(401);
  });

  test("POST /api/bulk-import/import - forbidden for non-admin", async () => {
    const csvContent = `name,description,price,stock,category_id,brand,sku,image_url,status\nTest,Desc,10,5,${shared.categoryId},Brand,CUSTM-001,,active`;
    const res = await request(app)
      .post("/api/bulk-import/import")
      .set("Authorization", `Bearer ${shared.customerToken}`)
      .attach("file", Buffer.from(csvContent), { filename: "products.csv", contentType: "text/csv" });
    expect(res.status).toBe(403);
  });

  test("POST /api/bulk-import/import - no file uploaded (400)", async () => {
    const res = await request(app)
      .post("/api/bulk-import/import")
      .set("Authorization", `Bearer ${shared.adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no csv file/i);
  });

  test("POST /api/bulk-import/import - valid CSV (201, success count)", async () => {
    const csvContent = [
      "name,description,price,stock,category_id,brand,sku,image_url,status",
      `Test Product,Desc,29.99,10,${shared.categoryId},Brand,TEST-BULK-001,,active`,
      `Test Product 2,Desc2,49.99,5,${shared.categoryId},Brand2,TEST-BULK-002,,active`,
    ].join("\n");

    const res = await request(app)
      .post("/api/bulk-import/import")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .attach("file", Buffer.from(csvContent), { filename: "products.csv", contentType: "text/csv" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.imported).toBe(2);
    expect(res.body.data.failed).toBe(0);
    expect(res.body.data.errors).toHaveLength(0);
  });

  test("POST /api/bulk-import/import - mixed valid/invalid rows (partial import)", async () => {
    const csvContent = [
      "name,description,price,stock,category_id,brand,sku,image_url,status",
      `Good Product,Good Desc,19.99,10,${shared.categoryId},Brand,TEST-GOOD-001,,active`,
      // missing name, invalid price
      `,,invalid_price,0,${shared.categoryId},Brand,TEST-BAD-001,,active`,
    ].join("\n");

    const res = await request(app)
      .post("/api/bulk-import/import")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .attach("file", Buffer.from(csvContent), { filename: "products.csv", contentType: "text/csv" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.imported).toBe(1);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.errors.length).toBe(1);
    expect(res.body.data.errors[0].row).toBe(2);
  });

  test("POST /api/bulk-import/import - empty CSV body (400)", async () => {
    // Only header row, no data rows
    const csvContent = "name,description,price,stock,category_id,brand,sku,image_url,status\n";

    const res = await request(app)
      .post("/api/bulk-import/import")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .attach("file", Buffer.from(csvContent), { filename: "products.csv", contentType: "text/csv" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/bulk-import/import - duplicate SKU rows (handled as errors)", async () => {
    const csvContent = [
      "name,description,price,stock,category_id,brand,sku,image_url,status",
      // SKU TEST-BULK-001 was already imported in the valid test above
      `Dup Product,Desc,9.99,1,${shared.categoryId},Brand,TEST-BULK-001,,active`,
    ].join("\n");

    const res = await request(app)
      .post("/api/bulk-import/import")
      .set("Authorization", `Bearer ${shared.adminToken}`)
      .attach("file", Buffer.from(csvContent), { filename: "products.csv", contentType: "text/csv" });

    expect(res.status).toBe(201);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.imported).toBe(0);
  });
});
