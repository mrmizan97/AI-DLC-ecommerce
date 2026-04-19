const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const { validateCategory } = require("../middleware/validate");

router.post("/", validateCategory, categoryController.create);
router.get("/", categoryController.findAll);
router.get("/:id", categoryController.findById);
router.put("/:id", validateCategory, categoryController.update);
router.delete("/:id", categoryController.delete);

module.exports = router;
