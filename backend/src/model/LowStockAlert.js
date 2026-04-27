const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LowStockAlert = sequelize.define(
  "LowStockAlert",
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
    current_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    alert_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "low_stock_alerts",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LowStockAlert;
