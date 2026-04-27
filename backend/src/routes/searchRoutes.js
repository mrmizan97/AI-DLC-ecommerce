const express = require("express");
const router = express.Router();
const searchController = require("../controller/searchController");

// GET /api/search/autocomplete?q=&limit=
router.get("/autocomplete", searchController.autocomplete);

// GET /api/search/suggestions?q=
router.get("/suggestions", searchController.suggestions);

// GET /api/search?q=&category_id=&min_price=&max_price=&tags=&page=&limit=
router.get("/", searchController.search);

module.exports = router;
