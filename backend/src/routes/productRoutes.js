const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const reviewController = require("../controller/reviewController");
const { validateProduct } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

router.post("/", validateProduct, productController.create);
router.get("/", productController.findAll);
router.get("/:id", productController.findById);
router.put("/:id", validateProduct, productController.update);
router.delete("/:id", productController.delete);
router.post("/:id/tags", productController.addTags);
router.delete("/:id/tags", productController.removeTags);

router.get("/:id/reviews", reviewController.listForProduct);
router.post("/:id/reviews", authenticate, reviewController.create);

module.exports = router;
