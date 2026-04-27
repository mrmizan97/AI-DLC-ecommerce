const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Address = sequelize.define(
  "Address",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    recipient_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address_line: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Bangladesh",
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "addresses",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Address;

// Associations (defined in src/model/index.js):
// User.hasMany(Address, { foreignKey: "user_id", as: "addresses" })
// Address.belongsTo(User, { foreignKey: "user_id", as: "user" })
