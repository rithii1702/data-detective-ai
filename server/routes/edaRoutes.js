const express = require("express");
const router = express.Router();

const { generateEDA } = require("../controllers/edaController");

router.get("/", generateEDA);

module.exports = router;