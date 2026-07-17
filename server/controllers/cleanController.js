const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

exports.cleanDataset = async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, "../uploads");

    const files = fs
      .readdirSync(uploadsPath)
      .filter(file => file.endsWith(".csv"));

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No uploaded dataset found."
      });
    }

    files.sort(
      (a, b) =>
        fs.statSync(path.join(uploadsPath, b)).mtimeMs -
        fs.statSync(path.join(uploadsPath, a)).mtimeMs
    );

    const latestFile = files[0];

    const rows = [];

    fs.createReadStream(path.join(uploadsPath, latestFile))
      .pipe(csv())
      .on("data", row => rows.push(row))
      .on("end", () => {

        const originalRows = rows.length;

        // Remove empty rows
        const cleanedRows = rows.filter(row =>
          Object.values(row).some(value => String(value).trim() !== "")
        );

        // Remove duplicate rows
        const uniqueRows = [
          ...new Map(
            cleanedRows.map(item => [JSON.stringify(item), item])
          ).values()
        ];

        res.json({
          success: true,
          fileName: latestFile,
          originalRows,
          cleanedRows: uniqueRows.length,
          removedRows: originalRows - uniqueRows.length,
          data: uniqueRows
        });

      })
      .on("error", err => {
        res.status(500).json({
          success: false,
          message: err.message
        });
      });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};