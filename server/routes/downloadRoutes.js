const express = require("express");
const router = express.Router();

const {
  downloadDataset,
} = require("../controllers/downloadController");

router.get("/:fileName", downloadDataset);

module.exports = router;