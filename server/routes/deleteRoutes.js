const express = require("express");

const router = express.Router();

const {
  deleteDataset,
} = require("../controllers/deleteController");

router.delete("/:fileName", deleteDataset);

module.exports = router;