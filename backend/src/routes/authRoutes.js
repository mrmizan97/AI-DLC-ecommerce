const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { validateRegister, validateLogin } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/profile", authenticate, authController.profile);

module.exports = router;
