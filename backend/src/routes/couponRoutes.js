const express = require("express");
const router = express.Router();
const couponController = require("../controller/couponController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.post("/validate", authenticate, couponController.validate);

router.post("/", authenticate, authorizeAdmin, couponController.create);
router.get("/", authenticate, authorizeAdmin, couponController.findAll);
router.get("/:id", authenticate, authorizeAdmin, couponController.findById);
router.put("/:id", authenticate, authorizeAdmin, couponController.update);
router.delete("/:id", authenticate, authorizeAdmin, couponController.delete);

module.exports = router;
