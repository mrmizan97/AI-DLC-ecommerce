const sequelize = require("../config/database");
const Product = require("./Product");
const Category = require("./Category");
const Tag = require("./Tag");
const User = require("./User");

// Category <-> Product (One-to-Many)
Category.hasMany(Product, { foreignKey: "category_id", as: "products" });
Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// Product <-> Tag (Many-to-Many)
Product.belongsToMany(Tag, { through: "product_tags", foreignKey: "product_id", otherKey: "tag_id", as: "tags" });
Tag.belongsToMany(Product, { through: "product_tags", foreignKey: "tag_id", otherKey: "product_id", as: "products" });

module.exports = { sequelize, Product, Category, Tag, User };
