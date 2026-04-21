const sequelize = require("../config/database");
const Product = require("./Product");
const Category = require("./Category");
const Tag = require("./Tag");
const User = require("./User");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Notification = require("./Notification");
const Media = require("./Media");

// Category <-> Product (One-to-Many)
Category.hasMany(Product, { foreignKey: "category_id", as: "products" });
Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// Product <-> Tag (Many-to-Many)
Product.belongsToMany(Tag, { through: "product_tags", foreignKey: "product_id", otherKey: "tag_id", as: "tags" });
Tag.belongsToMany(Product, { through: "product_tags", foreignKey: "tag_id", otherKey: "product_id", as: "products" });

// User <-> Order (One-to-Many)
User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Order <-> OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// Product <-> OrderItem (One-to-Many)
Product.hasMany(OrderItem, { foreignKey: "product_id", as: "order_items" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// User <-> Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Order <-> Notification (One-to-Many)
Order.hasMany(Notification, { foreignKey: "order_id", as: "notifications" });
Notification.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// Polymorphic media associations (filtered by mediable_type + scope)
Product.hasMany(Media, {
  foreignKey: "mediable_id",
  constraints: false,
  scope: { mediable_type: "Product" },
  as: "media",
});
Category.hasMany(Media, {
  foreignKey: "mediable_id",
  constraints: false,
  scope: { mediable_type: "Category" },
  as: "media",
});
User.hasMany(Media, {
  foreignKey: "mediable_id",
  constraints: false,
  scope: { mediable_type: "User" },
  as: "media",
});

module.exports = { sequelize, Product, Category, Tag, User, Order, OrderItem, Notification, Media };
