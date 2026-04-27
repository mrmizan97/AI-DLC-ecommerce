const express = require("express");
const router = express.Router();
const compareController = require("../controller/compareController");

// POST /api/compare
// Body: { product_ids: [1, 2, 3] }
router.post("/", compareController.compare);

module.exports = router;
