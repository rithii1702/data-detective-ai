const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

exports.getExplorerData = async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, "../uploads");

    const files = fs
      .readdirSync(uploadsPath)
      .filter(
        (file) =>
          file.endsWith(".csv") ||
          file.endsWith(".xlsx") ||
          file.endsWith(".xls")
      );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No uploaded dataset found.",
      });
    }

    files.sort(
      (a, b) =>
        fs.statSync(path.join(uploadsPath, b)).mtimeMs -
        fs.statSync(path.join(uploadsPath, a)).mtimeMs
    );

    const latestFile = files[0];
    const filePath = path.join(uploadsPath, latestFile);

    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        const columns = results.length ? Object.keys(results[0]) : [];

        res.json({
          success: true,
          fileName: latestFile,
          totalRows: results.length,
          totalColumns: columns.length,
          columns,
          data: results,
        });
      })
      .on("error", (err) => {
        res.status(500).json({
          success: false,
          message: err.message,
        });
      });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};