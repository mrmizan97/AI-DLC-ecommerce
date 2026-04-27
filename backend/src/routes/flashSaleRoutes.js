const express = require("express");
const router = express.Router();
const flashSaleController = require("../controller/flashSaleController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.get("/active", flashSaleController.getActive);
router.get("/", flashSaleController.findAll);
router.get("/:id", flashSaleController.findById);

router.post("/", authenticate, authorizeAdmin, flashSaleController.create);
router.put("/:id", authenticate, authorizeAdmin, flashSaleController.update);
router.delete("/:id", authenticate, authorizeAdmin, flashSaleController.delete);

module.exports = router;
