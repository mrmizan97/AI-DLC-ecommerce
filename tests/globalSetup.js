require("dotenv").config();
process.env.NODE_ENV = "test";

const { sequelize } = require("../src/model");
const request = require("supertest");
const app = require("../src/app");
const fs = require("fs");
const path = require("path");

module.exports = async () => {
  await sequelize.sync({ force: true });

  // Seed admin
  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@test.com",
    password: "admin123",
    phone: "01700000000",
    role: "admin",
  });

  // Seed customer
  const customerRes = await request(app).post("/api/auth/register").send({
    name: "Customer User",
    email: "customer@test.com",
    password: "customer123",
    phone: "01711111111",
  });

  // Seed category
  const catRes = await request(app).post("/api/categories").send({
    name: "Electronics",
    description: "Electronic items",
  });

  // Seed tags
  const tag1Res = await request(app).post("/api/tags").send({ name: "wireless" });
  const tag2Res = await request(app).post("/api/tags").send({ name: "premium" });

  // Seed products
  const prodRes = await request(app).post("/api/products").send({
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse",
    price: 29.99,
    stock: 100,
    category_id: catRes.body.data.id,
    brand: "Logitech",
    sku: "WM-001",
  });

  const prod2Res = await request(app).post("/api/products").send({
    name: "USB Keyboard",
    description: "Mechanical keyboard",
    price: 59.99,
    stock: 50,
    category_id: catRes.body.data.id,
    brand: "Corsair",
    sku: "KB-001",
  });

  // Write shared data to temp file (globalSetup runs in separate process)
  const shared = {
    adminToken: adminRes.body.data.token,
    adminId: adminRes.body.data.user.id,
    customerToken: customerRes.body.data.token,
    customerId: customerRes.body.data.user.id,
    categoryId: catRes.body.data.id,
    tagId: tag1Res.body.data.id,
    tagId2: tag2Res.body.data.id,
    productId: prodRes.body.data.id,
    productId2: prod2Res.body.data.id,
  };

  fs.writeFileSync(
    path.join(__dirname, "shared-data.json"),
    JSON.stringify(shared, null, 2)
  );

  await sequelize.close();
};
