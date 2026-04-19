const express = require("express");
const router = express.Router();
const tagController = require("../controller/tagController");
const { validateTag } = require("../middleware/validate");

router.post("/", validateTag, tagController.create);
router.get("/", tagController.findAll);
router.get("/:id", tagController.findById);
router.put("/:id", validateTag, tagController.update);
router.delete("/:id", tagController.delete);

module.exports = router;
