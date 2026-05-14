"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sliders", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      subtitle: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      cta_text: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      cta_link: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("sliders", ["is_active", "sort_order"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sliders");
  },
};
