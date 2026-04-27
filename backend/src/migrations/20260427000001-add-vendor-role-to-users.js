'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'role', {
      type: DataTypes.ENUM('admin', 'customer', 'vendor'),
      allowNull: false,
      defaultValue: 'customer',
    });

    // Add vendor-specific fields
    await queryInterface.addColumn('users', 'company_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'vendor_slug', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('users', 'vendor_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('users', 'vendor_rating', {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 0.00,
    });

    await queryInterface.addIndex('users', ['vendor_slug']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', ['vendor_slug']);
    await queryInterface.removeColumn('users', 'vendor_rating');
    await queryInterface.removeColumn('users', 'vendor_verified');
    await queryInterface.removeColumn('users', 'vendor_slug');
    await queryInterface.removeColumn('users', 'company_name');

    await queryInterface.changeColumn('users', 'role', {
      type: DataTypes.ENUM('admin', 'customer'),
      allowNull: false,
      defaultValue: 'customer',
    });
  }
};
