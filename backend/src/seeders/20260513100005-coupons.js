"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const inOneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert("coupons", [
      {
        code: "WELCOME10",
        type: "percentage",
        value: 10.00,
        min_order_amount: 500.00,
        max_uses: 1000,
        used_count: 0,
        is_active: true,
        expires_at: inOneMonth,
        created_at: now,
        updated_at: now,
      },
      {
        code: "FLAT200",
        type: "fixed",
        value: 200.00,
        min_order_amount: 2000.00,
        max_uses: 500,
        used_count: 0,
        is_active: true,
        expires_at: inOneMonth,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("coupons", {
      code: ["WELCOME10", "FLAT200"],
    });
  },
};
