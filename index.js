require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { sequelize } = require("./src/model");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const tagRoutes = require("./src/routes/tagRoutes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AI DLC CRUD API is running" });
});

app.use(errorHandler);

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synced successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err.message);
  });
