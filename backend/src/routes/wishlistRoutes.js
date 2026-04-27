const express = require("express");
const router = express.Router();
const wishlistController = require("../controller/wishlistController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, wishlistController.add);
router.get("/", authenticate, wishlistController.list);
router.get("/:productId/check", authenticate, wishlistController.check);
router.delete("/:productId", authenticate, wishlistController.remove);

module.exports = router;
