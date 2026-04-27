'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_variants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Variant name like "Size", "Color"',
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Variant value like "L", "Red"',
      },
      price_adjustment: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        comment: 'Price adjustment for this variant',
      },
      stock: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Stock for this specific variant',
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('product_variants', ['product_id']);
    await queryInterface.addIndex('product_variants', ['sku']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_variants');
  }
};
