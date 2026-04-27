const express = require("express");
const router = express.Router();
const addressController = require("../controller/addressController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, addressController.create);
router.get("/", authenticate, addressController.findAll);
router.get("/:id", authenticate, addressController.findById);
router.put("/:id", authenticate, addressController.update);
router.delete("/:id", authenticate, addressController.delete);
router.patch("/:id/default", authenticate, addressController.setDefault);

module.exports = router;
