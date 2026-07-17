const express = require("express");

const router = express.Router();

const {
  generateInsights
} = require("../controllers/insightController");

router.get("/", generateInsights);

module.exports = router;