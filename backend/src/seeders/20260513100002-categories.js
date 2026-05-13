"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("categories", [
      { name: "Electronics",       description: "Phones, laptops, gadgets",            created_at: now, updated_at: now },
      { name: "Fashion",           description: "Clothing, footwear, accessories",     created_at: now, updated_at: now },
      { name: "Home & Kitchen",    description: "Cookware, decor, small appliances",   created_at: now, updated_at: now },
      { name: "Books",             description: "Fiction, non-fiction, textbooks",     created_at: now, updated_at: now },
      { name: "Sports & Outdoors", description: "Fitness gear, outdoor equipment",     created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("categories", {
      name: ["Electronics", "Fashion", "Home & Kitchen", "Books", "Sports & Outdoors"],
    });
  },
};
