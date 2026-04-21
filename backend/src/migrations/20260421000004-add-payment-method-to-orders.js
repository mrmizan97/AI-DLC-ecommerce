"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "payment_method", {
      type: Sequelize.ENUM("online", "cash"),
      allowNull: false,
      defaultValue: "cash",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "payment_method");
  },
};
