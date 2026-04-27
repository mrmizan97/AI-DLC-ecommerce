const express = require("express");
const router = express.Router();
const vendorController = require("../controller/vendorController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// Public routes
router.get("/", vendorController.getAllVendors);
router.get("/:identifier", vendorController.getVendor);

// Vendor-only routes
router.get(
  "/profile/stats",
  authenticate,
  authorizeRoles("vendor"),
  vendorController.getStats
);
router.get(
  "/profile",
  authenticate,
  authorizeRoles("vendor"),
  vendorController.getProfile
);
router.put(
  "/profile",
  authenticate,
  authorizeRoles("vendor"),
  vendorController.updateProfile
);
router.get(
  "/products",
  authenticate,
  authorizeRoles("vendor"),
  vendorController.getProducts
);
router.post(
  "/withdrawals",
  authenticate,
  authorizeRoles("vendor"),
  vendorController.createWithdrawal
);
router.get(
  "/withdrawals",
  authenticate,
  authorizeRoles("vendor"),
  vendorController.getWithdrawals
);

// Admin-only routes
router.post(
  "/:vendorId/verification",
  authenticate,
  authorizeRoles("admin"),
  vendorController.toggleVerification
);
router.post(
  "/withdrawals/:withdrawalId/process",
  authenticate,
  authorizeRoles("admin"),
  vendorController.processWithdrawal
);

module.exports = router;
