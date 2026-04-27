const express = require("express");
const router = express.Router();
const salesReportController = require("../controller/salesReportController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// All routes require admin authentication
router.use(authenticate, authorizeAdmin);

router.get("/summary",       salesReportController.getSummary);
router.get("/top-products",  salesReportController.getTopProducts);
router.get("/top-customers", salesReportController.getTopCustomers);
router.get("/export/csv",    salesReportController.exportCSV);
router.get("/export/json",   salesReportController.exportJSON);

module.exports = router;
