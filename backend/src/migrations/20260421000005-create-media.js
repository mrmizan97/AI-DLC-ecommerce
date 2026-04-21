"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("media", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      mediable_type: { type: Sequelize.STRING(50), allowNull: false },
      mediable_id: { type: Sequelize.INTEGER, allowNull: false },
      url: { type: Sequelize.STRING(500), allowNull: false },
      filename: { type: Sequelize.STRING(255), allowNull: true },
      mime_type: { type: Sequelize.STRING(100), allowNull: true },
      size: { type: Sequelize.INTEGER, allowNull: true },
      collection: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "default" },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_thumbnail: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("media", ["mediable_type", "mediable_id"], { name: "media_mediable_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("media");
  },
};
