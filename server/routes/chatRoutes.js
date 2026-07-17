const express = require("express");
const router = express.Router();
const { chatAI } = require("../controllers/chatController");

router.post("/", chatAI);

module.exports = router;