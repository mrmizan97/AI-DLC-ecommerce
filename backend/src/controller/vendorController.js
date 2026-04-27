const vendorService = require("../service/vendorService");

const vendorController = {
  // Get all vendors (admin only)
  getAllVendors: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, verified, search } = req.query;
      const result = await vendorService.getAllVendors(page, limit, {
        verified,
        search,
      });

      res.status(200).json({
        success: true,
        message: "Vendors retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single vendor
  getVendor: async (req, res, next) => {
    try {
      const { identifier } = req.params;
      const vendor = await vendorService.getVendor(identifier);

      res.status(200).json({
        success: true,
        message: "Vendor retrieved successfully",
        data: vendor,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get vendor profile (for logged-in vendor)
  getProfile: async (req, res, next) => {
    try {
      const vendor = await vendorService.getVendor(req.user.id);

      res.status(200).json({
        success: true,
        message: "Vendor profile retrieved successfully",
        data: vendor,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update vendor profile
  updateProfile: async (req, res, next) => {
    try {
      const vendor = await vendorService.updateVendorProfile(
        req.user.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: vendor,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get vendor dashboard stats
  getStats: async (req, res, next) => {
    try {
      const stats = await vendorService.getVendorStats(req.user.id);

      res.status(200).json({
        success: true,
        message: "Vendor stats retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get vendor products
  getProducts: async (req, res, next) => {
    try {
      const { status, search } = req.query;
      const products = await vendorService.getVendorProducts(req.user.id, {
        status,
        search,
      });

      res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create withdrawal request
  createWithdrawal: async (req, res, next) => {
    try {
      const { amount, payment_method, payment_details, notes } = req.body;

      const withdrawal = await vendorService.createWithdrawal(req.user.id, {
        amount,
        payment_method,
        payment_details,
        notes,
      });

      res.status(201).json({
        success: true,
        message: "Withdrawal request created successfully",
        data: withdrawal,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get withdrawal history
  getWithdrawals: async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await vendorService.getWithdrawals(
        req.user.id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: "Withdrawals retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Toggle vendor verification
  toggleVerification: async (req, res, next) => {
    try {
      const { vendorId } = req.params;
      const { verified } = req.body;

      const vendor = await vendorService.toggleVendorVerification(
        vendorId,
        verified
      );

      res.status(200).json({
        success: true,
        message: `Vendor ${verified ? "verified" : "unverified"} successfully`,
        data: vendor,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Process withdrawal
  processWithdrawal: async (req, res, next) => {
    try {
      const { withdrawalId } = req.params;
      const { status, admin_notes } = req.body;

      const withdrawal = await vendorService.processWithdrawal(
        withdrawalId,
        status,
        admin_notes
      );

      res.status(200).json({
        success: true,
        message: `Withdrawal ${status} successfully`,
        data: withdrawal,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = vendorController;
