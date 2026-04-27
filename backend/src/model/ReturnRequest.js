const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReturnRequest = sequelize.define(
  "ReturnRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    tableName: "return_requests",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ReturnRequest;
