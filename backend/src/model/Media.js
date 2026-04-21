const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Media = sequelize.define(
  "Media",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mediable_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    mediable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    collection: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "default",
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_thumbnail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "media",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["mediable_type", "mediable_id"] }],
  }
);

module.exports = Media;
