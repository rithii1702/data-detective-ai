const express = require("express");

const router = express.Router();

const {
  detectiveAI,
} = require("../controllers/detectiveController");

router.get("/", detectiveAI);

module.exports = router;