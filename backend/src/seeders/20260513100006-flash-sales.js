"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const startsAt = new Date(now.getTime() - 60 * 60 * 1000); // started 1h ago
    const endsAt   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // ends in 7 days

    const [products] = await queryInterface.sequelize.query(
      "SELECT id, sku, price FROM products WHERE sku IN ('ELEC-WBH-001','ELEC-WGM-003')"
    );
    if (products.length === 0) return;

    const rows = products.map((p) => {
      const original = Number(p.price);
      const sale = Math.round(original * 0.7 * 100) / 100; // 30% off
      return {
        product_id: p.id,
        sale_price: sale,
        original_price: original,
        discount_percentage: 30.00,
        start_time: startsAt,
        end_time: endsAt,
        stock_limit: 10,
        sold_count: 0,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
    });

    await queryInterface.bulkInsert("flash_sales", rows);
  },

  async down(queryInterface) {
    const [products] = await queryInterface.sequelize.query(
      "SELECT id FROM products WHERE sku IN ('ELEC-WBH-001','ELEC-WGM-003')"
    );
    if (products.length === 0) return;
    await queryInterface.bulkDelete("flash_sales", {
      product_id: products.map((p) => p.id),
    });
  },
};
