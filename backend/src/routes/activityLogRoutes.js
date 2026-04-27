const express = require("express");
const router = express.Router();
const activityLogController = require("../controller/activityLogController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// Admin: list all activity logs with filters
router.get("/", authenticate, authorizeAdmin, activityLogController.findAll);

// Authenticated user: view own activity history
router.get("/mine", authenticate, activityLogController.findByUser);

module.exports = router;
