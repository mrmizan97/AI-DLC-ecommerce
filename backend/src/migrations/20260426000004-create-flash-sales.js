"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("flash_sales", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      sale_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      original_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      discount_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      start_time: { type: Sequelize.DATE, allowNull: false },
      end_time: { type: Sequelize.DATE, allowNull: false },
      stock_limit: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      sold_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("flash_sales");
  },
};
