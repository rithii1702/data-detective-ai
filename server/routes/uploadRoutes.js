const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { uploadDataset } = require("../controllers/uploadController");

// POST /api/upload
router.post("/", upload.single("dataset"), uploadDataset);

module.exports = router;