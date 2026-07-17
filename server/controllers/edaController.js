const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

exports.generateEDA = async (req, res) => {
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

        if (rows.length === 0) {
          return res.json({
            success: false,
            message: "Dataset is empty."
          });
        }

        const columns = Object.keys(rows[0]);

        const numericColumns = columns.filter(col =>
          rows.every(r => !isNaN(Number(r[col])))
        );

        res.json({
          success: true,
          fileName: latestFile,
          totalRows: rows.length,
          columns,
          numericColumns,
          data: rows
        });

      });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};