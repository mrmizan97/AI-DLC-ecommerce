const express = require("express");
const router = express.Router();
const sliderController = require("../controller/sliderController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.get("/active", sliderController.getActive);
router.get("/", sliderController.findAll);
router.get("/:id", sliderController.findById);

router.post("/", authenticate, authorizeAdmin, sliderController.create);
router.put("/:id", authenticate, authorizeAdmin, sliderController.update);
router.delete("/:id", authenticate, authorizeAdmin, sliderController.delete);

module.exports = router;
