const express = require("express");
const router = express.Router();

const { getExplorerData } = require("../controllers/explorerController");

router.get("/", getExplorerData);

module.exports = router;