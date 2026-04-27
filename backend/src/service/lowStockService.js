const { Op } = require("sequelize");
const LowStockAlert = require("../model/LowStockAlert");
const { Product, User } = require("../model");
const emailService = require("./emailService");

// Set up association if not already defined via index.js
if (!LowStockAlert.associations || !LowStockAlert.associations.product) {
  LowStockAlert.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  Product.hasMany(LowStockAlert, { foreignKey: "product_id", as: "low_stock_alerts" });
}

const lowStockService = {
  /**
   * Check if stock is at or below threshold. If so, create a new alert record
   * (only if no existing unresolved alert for this product) and send email to admins.
   */
  async check(productId, currentStock, threshold = 10) {
    try {
      if (currentStock > threshold) return null;

      // Check for existing unresolved alert for this product
      const existing = await LowStockAlert.findOne({
        where: { product_id: productId, resolved: false },
      });

      if (existing) {
        // Alert already open — optionally update current_stock
        await existing.update({ current_stock: currentStock });
        return existing;
      }

      // Create a new alert
      const alert = await LowStockAlert.create({
        product_id: productId,
        current_stock: currentStock,
        threshold,
        alert_sent: false,
        resolved: false,
      });

      // Fetch product for email content
      const product = await Product.findByPk(productId);

      // Fetch all admin emails and send alert — non-blocking
      User.findAll({ where: { role: "admin" }, attributes: ["email"] })
        .then(async (admins) => {
          for (const admin of admins) {
            await emailService.sendLowStockAlert(admin.email, product || { id: productId, name: `Product #${productId}`, stock: currentStock });
          }
          await alert.update({ alert_sent: true });
        })
        .catch((err) => console.error("[lowStockService] Email alert error:", err.message));

      return alert;
    } catch (err) {
      console.error("[lowStockService] check error:", err.message);
      return null;
    }
  },

  /**
   * List all alerts with optional filtering by resolved status. Paginated.
   */
  async findAll(query = {}) {
    const { page = 1, limit = 10, resolved } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (resolved !== undefined && resolved !== "") {
      where.resolved = resolved === "true" || resolved === true;
    }

    const { count, rows } = await LowStockAlert.findAndCountAll({
      where,
      include: [{ model: Product, as: "product", attributes: ["id", "name", "sku", "stock"] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  /**
   * Mark an alert as resolved.
   */
  async resolve(id) {
    const alert = await LowStockAlert.findByPk(id);
    if (!alert) return null;
    return await alert.update({ resolved: true });
  },

  /**
   * Get all unresolved alerts.
   */
  async getUnresolved() {
    const rows = await LowStockAlert.findAll({
      where: { resolved: false },
      include: [{ model: Product, as: "product", attributes: ["id", "name", "sku", "stock"] }],
      order: [["created_at", "DESC"]],
    });
    return rows;
  },
};

module.exports = lowStockService;
