const { sequelize } = require("../model");
const { QueryTypes } = require("sequelize");

const salesReportService = {
  /**
   * Get aggregated sales summary grouped by day/week/month.
   * @param {Object} query - { start_date, end_date, group_by }
   */
  async getSalesSummary(query = {}) {
    const { start_date, end_date, group_by = "day" } = query;

    const validGroupBy = ["day", "week", "month"];
    const safeGroupBy = validGroupBy.includes(group_by) ? group_by : "day";

    let dateFormat;
    if (safeGroupBy === "day") {
      dateFormat = "%Y-%m-%d";
    } else if (safeGroupBy === "week") {
      dateFormat = "%Y-%u";
    } else {
      dateFormat = "%Y-%m";
    }

    let whereClause = "WHERE o.payment_status = 'paid'";
    const replacements = {};

    if (start_date) {
      whereClause += " AND o.created_at >= :start_date";
      replacements.start_date = new Date(start_date);
    }
    if (end_date) {
      whereClause += " AND o.created_at <= :end_date";
      replacements.end_date = new Date(end_date);
    }

    const periodSql = `
      SELECT
        DATE_FORMAT(o.created_at, '${dateFormat}') AS period,
        COUNT(DISTINCT o.id)                        AS order_count,
        SUM(o.total_amount)                         AS revenue,
        AVG(o.total_amount)                         AS avg_order_value
      FROM orders o
      ${whereClause}
      GROUP BY period
      ORDER BY period ASC
    `;

    const totalSql = `
      SELECT
        COUNT(DISTINCT o.id)  AS total_orders,
        SUM(o.total_amount)   AS total_revenue,
        AVG(o.total_amount)   AS avg_order_value
      FROM orders o
      ${whereClause}
    `;

    const [periods, [totals]] = await Promise.all([
      sequelize.query(periodSql, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(totalSql, { replacements, type: QueryTypes.SELECT }),
    ]);

    return {
      group_by: safeGroupBy,
      start_date: start_date || null,
      end_date: end_date || null,
      totals: {
        total_orders: parseInt(totals.total_orders, 10) || 0,
        total_revenue: parseFloat(totals.total_revenue) || 0,
        avg_order_value: parseFloat(totals.avg_order_value) || 0,
      },
      periods,
    };
  },

  /**
   * Get top-selling products by quantity and revenue.
   * @param {Object} query - { start_date, end_date, limit }
   */
  async getTopProducts(query = {}) {
    const { start_date, end_date, limit = 10 } = query;

    let whereClause = "WHERE o.payment_status = 'paid'";
    const replacements = { limit: parseInt(limit, 10) || 10 };

    if (start_date) {
      whereClause += " AND o.created_at >= :start_date";
      replacements.start_date = new Date(start_date);
    }
    if (end_date) {
      whereClause += " AND o.created_at <= :end_date";
      replacements.end_date = new Date(end_date);
    }

    const sql = `
      SELECT
        p.id                        AS product_id,
        p.name                      AS product_name,
        p.sku,
        p.brand,
        SUM(oi.quantity)            AS total_quantity_sold,
        SUM(oi.quantity * oi.price) AS total_revenue,
        COUNT(DISTINCT o.id)        AS order_count
      FROM order_items oi
      JOIN orders o    ON oi.order_id   = o.id
      JOIN products p  ON oi.product_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name, p.sku, p.brand
      ORDER BY total_quantity_sold DESC
      LIMIT :limit
    `;

    const products = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    return products;
  },

  /**
   * Get top customers by order count and total spend.
   * @param {Object} query - { start_date, end_date, limit }
   */
  async getTopCustomers(query = {}) {
    const { start_date, end_date, limit = 10 } = query;

    let whereClause = "WHERE o.payment_status = 'paid'";
    const replacements = { limit: parseInt(limit, 10) || 10 };

    if (start_date) {
      whereClause += " AND o.created_at >= :start_date";
      replacements.start_date = new Date(start_date);
    }
    if (end_date) {
      whereClause += " AND o.created_at <= :end_date";
      replacements.end_date = new Date(end_date);
    }

    const sql = `
      SELECT
        u.id              AS user_id,
        u.name            AS customer_name,
        u.email,
        COUNT(o.id)       AS order_count,
        SUM(o.total_amount) AS total_spend,
        AVG(o.total_amount) AS avg_order_value
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
      GROUP BY u.id, u.name, u.email
      ORDER BY total_spend DESC
      LIMIT :limit
    `;

    const customers = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
    return customers;
  },

  /**
   * Convert report data object to a CSV string manually.
   * @param {Object} data - { summary, topProducts, topCustomers }
   * @returns {string}
   */
  generateCSVReport(data) {
    const { summary, topProducts, topCustomers } = data;
    const lines = [];

    // --- Summary Section ---
    lines.push("=== SALES SUMMARY ===");
    lines.push(`Group By,${summary.group_by}`);
    lines.push(`Start Date,${summary.start_date || "N/A"}`);
    lines.push(`End Date,${summary.end_date || "N/A"}`);
    lines.push(`Total Orders,${summary.totals.total_orders}`);
    lines.push(`Total Revenue,${summary.totals.total_revenue}`);
    lines.push(`Avg Order Value,${summary.totals.avg_order_value}`);
    lines.push("");

    lines.push("Period,Order Count,Revenue,Avg Order Value");
    for (const p of (summary.periods || [])) {
      lines.push(`${p.period},${p.order_count},${p.revenue},${p.avg_order_value}`);
    }
    lines.push("");

    // --- Top Products Section ---
    lines.push("=== TOP PRODUCTS ===");
    lines.push("Product ID,Product Name,SKU,Brand,Total Quantity Sold,Total Revenue,Order Count");
    for (const p of (topProducts || [])) {
      const name = String(p.product_name || "").replace(/,/g, " ");
      const brand = String(p.brand || "").replace(/,/g, " ");
      lines.push(`${p.product_id},${name},${p.sku || ""},${brand},${p.total_quantity_sold},${p.total_revenue},${p.order_count}`);
    }
    lines.push("");

    // --- Top Customers Section ---
    lines.push("=== TOP CUSTOMERS ===");
    lines.push("User ID,Name,Email,Order Count,Total Spend,Avg Order Value");
    for (const c of (topCustomers || [])) {
      const name = String(c.customer_name || "").replace(/,/g, " ");
      const email = String(c.email || "").replace(/,/g, " ");
      lines.push(`${c.user_id},${name},${email},${c.order_count},${c.total_spend},${c.avg_order_value}`);
    }

    return lines.join("\n");
  },

  /**
   * Combine summary + top products + top customers into one report object.
   * @param {Object} query
   */
  async generateFullReport(query = {}) {
    const [summary, topProducts, topCustomers] = await Promise.all([
      this.getSalesSummary(query),
      this.getTopProducts(query),
      this.getTopCustomers(query),
    ]);

    return { summary, topProducts, topCustomers };
  },
};

module.exports = salesReportService;
