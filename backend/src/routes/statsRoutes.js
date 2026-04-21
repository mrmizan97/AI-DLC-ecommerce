const express = require("express");
const router = express.Router();
const statsController = require("../controller/statsController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.get("/dashboard", authenticate, authorizeAdmin, statsController.dashboard);

module.exports = router;
