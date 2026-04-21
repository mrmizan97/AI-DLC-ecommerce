"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "payment_status", {
      type: Sequelize.ENUM("pending", "paid", "failed", "cancelled", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    });

    await queryInterface.addColumn("orders", "tran_id", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addConstraint("orders", {
      fields: ["tran_id"],
      type: "unique",
      name: "orders_tran_id_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("orders", "orders_tran_id_unique");
    await queryInterface.removeColumn("orders", "tran_id");
    await queryInterface.removeColumn("orders", "payment_status");
  },
};
