"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("tags", [
      { name: "new",       created_at: now, updated_at: now },
      { name: "bestseller", created_at: now, updated_at: now },
      { name: "sale",      created_at: now, updated_at: now },
      { name: "eco",       created_at: now, updated_at: now },
      { name: "premium",   created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("tags", {
      name: ["new", "bestseller", "sale", "eco", "premium"],
    });
  },
};
