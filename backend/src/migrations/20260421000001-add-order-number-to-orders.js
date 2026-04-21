"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add the column as nullable first (so existing rows pass)
    await queryInterface.addColumn("orders", "order_number", {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    // 2. Backfill existing orders with unique 6-digit numbers
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM orders WHERE order_number IS NULL"
    );
    const used = new Set();
    for (const row of rows) {
      let num;
      do {
        num = String(Math.floor(100000 + Math.random() * 900000));
      } while (used.has(num));
      used.add(num);
      await queryInterface.sequelize.query(
        "UPDATE orders SET order_number = :num WHERE id = :id",
        { replacements: { num, id: row.id } }
      );
    }

    // 3. Enforce NOT NULL + UNIQUE
    await queryInterface.changeColumn("orders", "order_number", {
      type: Sequelize.STRING(6),
      allowNull: false,
    });
    await queryInterface.addConstraint("orders", {
      fields: ["order_number"],
      type: "unique",
      name: "orders_order_number_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("orders", "orders_order_number_unique");
    await queryInterface.removeColumn("orders", "order_number");
  },
};
