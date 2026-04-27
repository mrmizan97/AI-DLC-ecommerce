const express = require("express");
const router = express.Router();
const bulkImportController = require("../controller/bulkImportController");
const csvUpload = require("../middleware/csvUpload");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// GET /api/bulk-import/template — download CSV template
router.get(
  "/template",
  authenticate,
  authorizeAdmin,
  bulkImportController.downloadTemplate
);

// POST /api/bulk-import/import — upload and import CSV
router.post(
  "/import",
  authenticate,
  authorizeAdmin,
  csvUpload.single("file"),
  bulkImportController.importProducts
);

module.exports = router;
