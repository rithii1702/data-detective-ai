const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

exports.uploadDataset = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const results = [];
    const filePath = path.join(__dirname, "../uploads", req.file.filename);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        const columns =
          results.length > 0 ? Object.keys(results[0]) : [];

        // Missing Values
        const missingValues = {};

        columns.forEach((column) => {
          missingValues[column] = 0;
        });

        results.forEach((row) => {
          columns.forEach((column) => {
            const value = row[column];

            if (
              value === "" ||
              value === null ||
              value === undefined
            ) {
              missingValues[column]++;
            }
          });
        });

        // Duplicate Rows
        const uniqueRows = new Set();
        let duplicateRows = 0;

        results.forEach((row) => {
          const rowString = JSON.stringify(row);

          if (uniqueRows.has(rowString)) {
            duplicateRows++;
          } else {
            uniqueRows.add(rowString);
          }
        });

        res.status(200).json({
          success: true,
          message: "Dataset analyzed successfully.",

          summary: {
            fileName: req.file.originalname,
            totalRows: results.length,
            totalColumns: columns.length,
            columns,
            missingValues,
            duplicateRows,
          },

          preview: results.slice(0, 10),
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