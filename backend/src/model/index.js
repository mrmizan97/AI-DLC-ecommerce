const sequelize = require("../config/database");
const Product = require("./Product");
const Category = require("./Category");
const Tag = require("./Tag");
const User = require("./User");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Notification = require("./Notification");
const Media = require("./Media");
const Review = require("./Review");
const ProductVariant = require("./ProductVariant");
const Wishlist = require("./Wishlist");
const Coupon = require("./Coupon");
const FlashSale = require("./FlashSale");
const ReturnRequest = require("./ReturnRequest");
const ActivityLog = require("./ActivityLog");
const Address = require("./Address");
const LowStockAlert = require("./LowStockAlert");
const Slider = require("./Slider");

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

// Product <-> Review (One-to-Many)
Product.hasMany(Review, { foreignKey: "product_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// User <-> Review (One-to-Many)
User.hasMany(Review, { foreignKey: "user_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Product <-> ProductVariant (One-to-Many)
Product.hasMany(ProductVariant, { foreignKey: "product_id", as: "variants", onDelete: "CASCADE" });
ProductVariant.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// User <-> Wishlist (One-to-Many)
User.hasMany(Wishlist, { foreignKey: "user_id", as: "wishlists" });
Wishlist.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Product <-> Wishlist (One-to-Many)
Product.hasMany(Wishlist, { foreignKey: "product_id", as: "wishlists" });
Wishlist.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// User <-> Address (One-to-Many)
User.hasMany(Address, { foreignKey: "user_id", as: "addresses" });
Address.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User <-> ActivityLog (One-to-Many)
User.hasMany(ActivityLog, { foreignKey: "user_id", as: "activity_logs" });
ActivityLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User <-> ReturnRequest (One-to-Many)
User.hasMany(ReturnRequest, { foreignKey: "user_id", as: "return_requests" });
ReturnRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Order <-> ReturnRequest (One-to-Many)
Order.hasMany(ReturnRequest, { foreignKey: "order_id", as: "return_requests" });
ReturnRequest.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// Product <-> ReturnRequest (One-to-Many)
Product.hasMany(ReturnRequest, { foreignKey: "product_id", as: "return_requests" });
ReturnRequest.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// Product <-> LowStockAlert (One-to-Many)
Product.hasMany(LowStockAlert, { foreignKey: "product_id", as: "low_stock_alerts" });
LowStockAlert.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// Product <-> FlashSale (One-to-Many)
Product.hasMany(FlashSale, { foreignKey: "product_id", as: "flash_sales" });
FlashSale.belongsTo(Product, { foreignKey: "product_id", as: "product" });

module.exports = {
  sequelize,
  Product,
  Category,
  Tag,
  User,
  Order,
  OrderItem,
  Notification,
  Media,
  Review,
  ProductVariant,
  Wishlist,
  Coupon,
  FlashSale,
  ReturnRequest,
  ActivityLog,
  Address,
  LowStockAlert,
  Slider,
};
