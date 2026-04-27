const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Wishlist = sequelize.define(
  "Wishlist",
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "wishlists",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["user_id", "product_id"], name: "wishlists_user_product_uniq" },
    ],
  }
);

module.exports = Wishlist;

// Associations (defined in src/model/index.js):
// User.hasMany(Wishlist, { foreignKey: "user_id", as: "wishlist_items" })
// Wishlist.belongsTo(User, { foreignKey: "user_id", as: "user" })
// Product.hasMany(Wishlist, { foreignKey: "product_id", as: "wishlist_entries" })
// Wishlist.belongsTo(Product, { foreignKey: "product_id", as: "product" })
