const { Op, fn, col, literal } = require("sequelize");
const { sequelize, Product, Category, Tag, User, Order } = require("../model");

const statsService = {
  async dashboard() {
    // Parallel counts
    const [productsCount, categoriesCount, tagsCount, usersCount, ordersCount] = await Promise.all([
      Product.count(),
      Category.count(),
      Tag.count(),
      User.count(),
      Order.count(),
    ]);

    // Revenue: sum non-cancelled orders
    const revenueRow = await Order.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("total_amount")), 0), "revenue"]],
      where: { status: { [Op.ne]: "cancelled" } },
      raw: true,
    });
    const revenue = parseFloat(revenueRow?.revenue || 0);

    // Orders per day, last 7 days
    const last7 = new Date();
    last7.setDate(last7.getDate() - 6);
    last7.setHours(0, 0, 0, 0);

    const ordersByDayRows = await Order.findAll({
      attributes: [
        [fn("DATE", col("created_at")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { created_at: { [Op.gte]: last7 } },
      group: [literal("DATE(created_at)")],
      raw: true,
    });

    // Fill in missing days with 0
    const ordersByDay = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(last7);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const found = ordersByDayRows.find((r) => {
        const rowDate = typeof r.date === "string" ? r.date.split("T")[0] : r.date.toISOString().split("T")[0];
        return rowDate === key;
      });
      ordersByDay.push({ date: key, count: found ? parseInt(found.count) : 0 });
    }

    // Order status distribution
    const statusRows = await Order.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      group: ["status"],
      raw: true,
    });
    const statusDistribution = statusRows.map((r) => ({
      status: r.status,
      count: parseInt(r.count),
    }));

    // Top 5 products by stock
    const topProducts = await Product.findAll({
      attributes: ["id", "name", "stock"],
      order: [["stock", "DESC"]],
      limit: 5,
      raw: true,
    });

    // Users by role
    const roleRows = await User.findAll({
      attributes: ["role", [fn("COUNT", col("id")), "count"]],
      group: ["role"],
      raw: true,
    });
    const usersByRole = roleRows.map((r) => ({
      role: r.role,
      count: parseInt(r.count),
    }));

    // Recent 5 orders
    const recentOrders = await Order.findAll({
      include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    return {
      totals: {
        revenue,
        orders: ordersCount,
        users: usersCount,
        products: productsCount,
        categories: categoriesCount,
        tags: tagsCount,
      },
      ordersByDay,
      statusDistribution,
      topProducts,
      usersByRole,
      recentOrders,
    };
  },
};

module.exports = statsService;
