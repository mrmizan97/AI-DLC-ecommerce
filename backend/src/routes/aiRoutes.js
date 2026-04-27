const express = require("express");
const router = express.Router();
const aiController = require("../controller/aiController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// GET /api/ai/recommendations — authenticated users only
router.get("/recommendations", authenticate, aiController.getRecommendations);

// POST /api/ai/sentiment — admin only
router.post("/sentiment/bulk", authenticate, authorizeAdmin, aiController.bulkAnalyzeSentiment);
router.post("/sentiment", authenticate, authorizeAdmin, aiController.analyzeSentiment);

// POST /api/ai/search — public
router.post("/search", aiController.naturalLanguageSearch);

// POST /api/ai/chat — public
router.post("/chat", aiController.chatbot);

module.exports = router;
