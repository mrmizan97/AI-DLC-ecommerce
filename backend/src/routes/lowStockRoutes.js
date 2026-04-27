const express = require("express");
const router = express.Router();
const lowStockController = require("../controller/lowStockController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// All routes require authentication + admin role
router.get("/", authenticate, authorizeAdmin, lowStockController.findAll);
router.get("/unresolved", authenticate, authorizeAdmin, lowStockController.getUnresolved);
router.patch("/:id/resolve", authenticate, authorizeAdmin, lowStockController.resolve);

module.exports = router;
