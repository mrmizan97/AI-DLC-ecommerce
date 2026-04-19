const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { validateUserUpdate } = require("../middleware/validate");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.get("/", authenticate, authorizeAdmin, userController.findAll);
router.get("/:id", authenticate, authorizeAdmin, userController.findById);
router.put("/:id", authenticate, authorizeAdmin, validateUserUpdate, userController.update);
router.delete("/:id", authenticate, authorizeAdmin, userController.delete);

module.exports = router;
