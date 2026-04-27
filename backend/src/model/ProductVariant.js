const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductVariant = sequelize.define(
  "ProductVariant",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Variant name like Size, Color",
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Variant value like L, Red",
    },
    price_adjustment: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: "Price adjustment for this variant",
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Stock for this specific variant",
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: "product_variants",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ProductVariant;
