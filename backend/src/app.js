const express = require("express");
const cors = require("cors");
const compression = require("compression");
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
const sliderRoutes = require("./routes/sliderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const aiTierTwoRoutes = require("./routes/aiTierTwoRoutes");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const { metricsMiddleware, metricsHandler } = require("./middleware/metrics");
const cacheControl = require("./middleware/cacheControl");

const app = express();

app.use(compression());
app.use(cors({ maxAge: 86400 }));
app.use(express.json());
app.use(metricsMiddleware);
app.get("/metrics", metricsHandler);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const publicReadCache = cacheControl(60);
app.use("/api/categories", publicReadCache);
app.use("/api/tags", publicReadCache);
app.use("/api/sliders", publicReadCache);
app.use("/api/flash-sales", publicReadCache);
app.use("/api/products", publicReadCache);
app.use("/api/search", publicReadCache);

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
app.use("/api/sliders", sliderRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/ai-tier2", aiTierTwoRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use(errorHandler);

module.exports = app;
