const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

// SSLCommerz POSTs urlencoded form data to these callbacks
router.use(express.urlencoded({ extended: true }));

router.post("/success", paymentController.success);
router.get("/success", paymentController.success);
router.post("/fail", paymentController.fail);
router.get("/fail", paymentController.fail);
router.post("/cancel", paymentController.cancel);
router.get("/cancel", paymentController.cancel);
router.post("/ipn", paymentController.ipn);

module.exports = router;
