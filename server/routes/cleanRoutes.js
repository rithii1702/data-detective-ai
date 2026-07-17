const express = require("express");
const router = express.Router();

const { cleanDataset } = require("../controllers/cleanController");

router.get("/", cleanDataset);

module.exports = router;