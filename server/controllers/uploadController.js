const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

exports.uploadDataset = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const filePath = path.join(
      __dirname,
      "../uploads",
      req.file.filename
    );

    // Read CSV / XLS / XLSX
    const workbook = XLSX.readFile(filePath);

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file does not contain any sheets.",
      });
    }

    const worksheet = workbook.Sheets[firstSheetName];

    const results = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    const columns =
      results.length > 0
        ? Object.keys(results[0])
        : [];

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

    return res.status(200).json({
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

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to process dataset.",
    });
  }
};