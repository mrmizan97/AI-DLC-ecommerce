const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const tagRoutes = require("./routes/tagRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const statsRoutes = require("./routes/statsRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const returnRequestRoutes = require("./routes/returnRequestRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const bulkImportRoutes = require("./routes/bulkImportRoutes");
const salesReportRoutes = require("./routes/salesReportRoutes");
const aiRoutes = require("./routes/aiRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const couponRoutes = require("./routes/couponRoutes");
const flashSaleRoutes = require("./routes/flashSaleRoutes");
const addressRoutes = require("./routes/addressRoutes");
const searchRoutes = require("./routes/searchRoutes");
const compareRoutes = require("./routes/compareRoutes");
const lowStockRoutes = require("./routes/lowStockRoutes");
const productVariantRoutes = require("./routes/productVariantRoutes");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/returns", returnRequestRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/bulk-import", bulkImportRoutes);
app.use("/api/reports", salesReportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/flash-sales", flashSaleRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/compare", compareRoutes);
app.use("/api/low-stock", lowStockRoutes);
app.use("/api/product-variants", productVariantRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AI DLC CRUD API is running" });
});

app.use(errorHandler);

module.exports = app;
