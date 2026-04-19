const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const { validateOrder, validateOrderStatus } = require("../middleware/validate");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.post("/", authenticate, validateOrder, orderController.create);
router.get("/", authenticate, orderController.findAll);
router.get("/:id", authenticate, orderController.findById);
router.patch("/:id/status", authenticate, authorizeAdmin, validateOrderStatus, orderController.updateStatus);
router.patch("/:id/cancel", authenticate, orderController.cancel);

module.exports = router;
