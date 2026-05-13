"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const hash = (pw) => bcrypt.hashSync(pw, 10);

    await queryInterface.bulkInsert("users", [
      {
        name: "Demo Admin",
        email: "admin@demo.com",
        password: hash("admin123"),
        phone: "+8801700000001",
        role: "admin",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Alice Customer",
        email: "alice@demo.com",
        password: hash("password123"),
        phone: "+8801700000002",
        role: "customer",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Bob Customer",
        email: "bob@demo.com",
        password: hash("password123"),
        phone: "+8801700000003",
        role: "customer",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: ["admin@demo.com", "alice@demo.com", "bob@demo.com"],
    });
  },
};
