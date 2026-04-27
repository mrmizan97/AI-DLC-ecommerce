'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'vendor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Vendor who owns this product',
    });

    await queryInterface.addColumn('products', 'is_featured', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('products', 'view_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn('products', 'sales_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addIndex('products', ['vendor_id']);
    await queryInterface.addIndex('products', ['is_featured']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('products', ['vendor_id']);
    await queryInterface.removeIndex('products', ['is_featured']);
    await queryInterface.removeColumn('products', 'sales_count');
    await queryInterface.removeColumn('products', 'view_count');
    await queryInterface.removeColumn('products', 'is_featured');
    await queryInterface.removeColumn('products', 'vendor_id');
  }
};
