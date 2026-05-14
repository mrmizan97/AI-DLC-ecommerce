const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Slider = sequelize.define(
  "Slider",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    subtitle: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    cta_text: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    cta_link: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "sliders",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Slider;
