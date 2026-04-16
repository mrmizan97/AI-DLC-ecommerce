require("dotenv").config();

const { sequelize } = require("../src/model");
const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Seed admin user
  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@test.com",
    password: "admin123",
    phone: "01700000000",
    role: "admin",
  });
  shared.adminToken = adminRes.body.data.token;
  shared.adminId = adminRes.body.data.user.id;

  // Seed customer user
  const customerRes = await request(app).post("/api/auth/register").send({
    name: "Customer User",
    email: "customer@test.com",
    password: "customer123",
    phone: "01711111111",
  });
  shared.customerToken = customerRes.body.data.token;
  shared.customerId = customerRes.body.data.user.id;

  // Seed category
  const catRes = await request(app).post("/api/categories").send({
    name: "Electronics",
    description: "Electronic items",
  });
  shared.categoryId = catRes.body.data.id;

  // Seed tags
  const tag1Res = await request(app).post("/api/tags").send({ name: "wireless" });
  shared.tagId = tag1Res.body.data.id;

  const tag2Res = await request(app).post("/api/tags").send({ name: "premium" });
  shared.tagId2 = tag2Res.body.data.id;

  // Seed product
  const prodRes = await request(app).post("/api/products").send({
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse",
    price: 29.99,
    stock: 100,
    category_id: shared.categoryId,
    brand: "Logitech",
    sku: "WM-001",
  });
  shared.productId = prodRes.body.data.id;

  // Seed second product
  const prod2Res = await request(app).post("/api/products").send({
    name: "USB Keyboard",
    description: "Mechanical keyboard",
    price: 59.99,
    stock: 50,
    category_id: shared.categoryId,
    brand: "Corsair",
    sku: "KB-001",
  });
  shared.productId2 = prod2Res.body.data.id;
});

afterAll(async () => {
  await sequelize.close();
});
