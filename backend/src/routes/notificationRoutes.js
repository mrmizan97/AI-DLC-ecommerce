const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", notificationController.findAll);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/all", notificationController.deleteAll);
router.delete("/:id", notificationController.delete);

module.exports = router;
