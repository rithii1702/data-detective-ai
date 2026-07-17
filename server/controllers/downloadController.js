const path = require("path");
const fs = require("fs");

exports.downloadDataset = (req, res) => {
  const { fileName } = req.params;

  const filePath = path.join(__dirname, "../uploads", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "Dataset not found",
    });
  }

  res.download(filePath);
};