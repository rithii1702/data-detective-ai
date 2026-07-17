const fs = require("fs");
const path = require("path");

exports.getHistory = async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadsPath)) {
      return res.json({
        success: true,
        history: [],
      });
    }

    const files = fs
      .readdirSync(uploadsPath)
      .filter((file) => file.endsWith(".csv"));

    const history = files.map((file) => {
      const stats = fs.statSync(path.join(uploadsPath, file));

      return {
        fileName: file,
        uploadedAt: stats.mtime,
        size: (stats.size / 1024).toFixed(2) + " KB",
        status: "Completed",
      };
    });

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};