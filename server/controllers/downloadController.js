const fs = require("fs");
const path = require("path");

exports.downloadDataset = (req, res) => {
  try {
    const { fileName } = req.params;

    const filePath = path.join(__dirname, "../uploads", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    // Force the browser to download the CSV
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    res.setHeader("Content-Type", "text/csv");

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Unable to download file.",
          });
        }
      }
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};