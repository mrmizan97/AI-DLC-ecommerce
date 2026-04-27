const express = require("express");
const router = express.Router();
const returnRequestController = require("../controller/returnRequestController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// Customer: submit a return request
router.post("/", authenticate, returnRequestController.create);

// Admin: list all return requests
router.get("/", authenticate, authorizeAdmin, returnRequestController.findAll);

// Customer: list own return requests
router.get("/mine", authenticate, returnRequestController.findByUser);

// Authenticated (own or admin): get single return request
router.get("/:id", authenticate, returnRequestController.findById);

// Admin: update status, admin_note, refund_amount
router.put("/:id", authenticate, authorizeAdmin, returnRequestController.updateStatus);

module.exports = router;
