const express = require("express");
const router = express.Router();
const uploadController = require("../controller/uploadController");
const upload = require("../middleware/upload");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

router.post("/", authenticate, authorizeAdmin, upload.single("file"), uploadController.upload);

module.exports = router;
