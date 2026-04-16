const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const { validateProduct } = require("../middleware/validate");

router.post("/", validateProduct, productController.create);
router.get("/", productController.findAll);
router.get("/:id", productController.findById);
router.put("/:id", validateProduct, productController.update);
router.delete("/:id", productController.delete);
router.post("/:id/tags", productController.addTags);
router.delete("/:id/tags", productController.removeTags);

module.exports = router;
