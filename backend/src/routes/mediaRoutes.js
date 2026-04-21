const express = require("express");
const router = express.Router();
const mediaController = require("../controller/mediaController");
const upload = require("../middleware/upload");
const { authenticate } = require("../middleware/auth");

router.post("/upload", authenticate, upload.single("file"), mediaController.upload);
router.get("/:type/:id", mediaController.list);
router.patch("/:id/thumbnail", authenticate, mediaController.setThumbnail);
router.delete("/:id", authenticate, mediaController.delete);

module.exports = router;
