const express = require("express");

const router = express.Router();

const { generateStory } = require("../controllers/storyController");

router.get("/", generateStory);

module.exports = router;