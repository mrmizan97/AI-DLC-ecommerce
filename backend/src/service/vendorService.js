const { User, Product, VendorWithdrawal, Order, OrderItem } = require("../model");
const { Op } = require("sequelize");

class VendorService {
  // Get all vendors with their stats
  async getAllVendors(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    const where = { role: "vendor" };

    if (filters.verified !== undefined) {
      where.vendor_verified = filters.verified === "true";
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { company_name: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ["password"],
        include: [
          [
            this.sequelize.literal(
              "(SELECT COUNT(*) FROM products WHERE products.vendor_id = User.id)"
            ),
            "product_count",
          ],
          [
            this.sequelize.literal(
              "(SELECT SUM(amount) FROM vendor_withdrawals WHERE vendor_withdrawals.vendor_id = User.id AND status = 'completed')"
            ),
            "total_withdrawn",
          ],
        ],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return {
      total: count,
      page: parseInt(page),
      per_page: parseInt(limit),
      vendors: rows,
    };
  }

  // Get single vendor by ID or slug
  async getVendor(identifier) {
    const where =
      isNaN(identifier) ? { vendor_slug: identifier } : { id: parseInt(identifier) };

    const vendor = await User.findOne({
      where: { ...where, role: "vendor" },
      attributes: { exclude: ["password"] },
      include: [
        {
          association: "vendor_products",
          where: { status: "active" },
          include: ["category", "tags"],
        },
      ],
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    return vendor;
  }

  // Update vendor profile
  async updateVendorProfile(vendorId, data) {
    const vendor = await User.findByPk(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      throw new Error("Vendor not found");
    }

    const allowedFields = ["name", "company_name", "phone", "vendor_slug"];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await vendor.update(updateData);
    return vendor;
  }

  // Verify/unverify vendor
  async toggleVendorVerification(vendorId, verified) {
    const vendor = await User.findByPk(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      throw new Error("Vendor not found");
    }

    await vendor.update({ vendor_verified: verified });
    return vendor;
  }

  // Get vendor dashboard stats
  async getVendorStats(vendorId) {
    const totalProducts = await Product.count({ where: { vendor_id: vendorId } });
    const activeProducts = await Product.count({
      where: { vendor_id: vendorId, status: "active" },
    });

    // Get total sales
    const products = await Product.findAll({
      where: { vendor_id: vendorId },
      attributes: ["id"],
    });
    const productIds = products.map((p) => p.id);

    const totalSales = await OrderItem.count({
      where: { product_id: productIds },
    });

    const totalRevenue = await OrderItem.sum("total_price", {
      where: { product_id: productIds },
    });

    // Pending withdrawals
    const pendingWithdrawals = await VendorWithdrawal.sum("amount", {
      where: { vendor_id: vendorId, status: "pending" },
    });

    return {
      total_products: totalProducts,
      active_products: activeProducts,
      total_sales: totalSales,
      total_revenue: parseFloat(totalRevenue) || 0,
      pending_withdrawals: parseFloat(pendingWithdrawals) || 0,
    };
  }

  // Create withdrawal request
  async createWithdrawal(vendorId, data) {
    const vendor = await User.findByPk(vendorId);

    if (!vendor || vendor.role !== "vendor") {
      throw new Error("Vendor not found");
    }

    // Calculate available balance
    const stats = await this.getVendorStats(vendorId);
    if (data.amount > stats.total_revenue) {
      throw new Error("Insufficient balance for withdrawal");
    }

    const withdrawal = await VendorWithdrawal.create({
      vendor_id: vendorId,
      amount: data.amount,
      payment_method: data.payment_method,
      payment_details: data.payment_details,
      notes: data.notes,
    });

    return withdrawal;
  }

  // Get vendor withdrawals
  async getWithdrawals(vendorId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await VendorWithdrawal.findAndCountAll({
      where: { vendor_id: vendorId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return {
      total: count,
      page: parseInt(page),
      per_page: parseInt(limit),
      withdrawals: rows,
    };
  }

  // Admin: Process withdrawal
  async processWithdrawal(withdrawalId, status, adminNotes = null) {
    const withdrawal = await VendorWithdrawal.findByPk(withdrawalId);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    if (withdrawal.status !== "pending") {
      throw new Error("Withdrawal request already processed");
    }

    await withdrawal.update({
      status,
      admin_notes: adminNotes,
      processed_at: status !== "pending" ? new Date() : null,
    });

    return withdrawal;
  }

  // Get vendor products with filters
  async getVendorProducts(vendorId, filters = {}) {
    const where = { vendor_id: vendorId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { sku: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    return await Product.findAll({
      where,
      include: ["category", "tags", "variants"],
      order: [["created_at", "DESC"]],
    });
  }
}

module.exports = new VendorService();
