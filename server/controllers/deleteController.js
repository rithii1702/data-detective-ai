const fs = require("fs");
const path = require("path");

exports.deleteDataset = async (req, res) => {
  try {
    const { fileName } = req.params;

    const filePath = path.join(__dirname, "../uploads", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Dataset not found",
      });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: "Dataset deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};