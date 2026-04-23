const express = require("express");
const router = express.Router();
const reviewController = require("../controller/reviewController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.get("/", authenticate, authorizeAdmin, reviewController.listAll);
router.put("/:id", authenticate, reviewController.update);
router.delete("/:id", authenticate, reviewController.delete);

module.exports = router;
