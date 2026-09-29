const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const csv = require("csv-parser");

exports.cleanDataset = async (req, res) => {
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

    // Find latest uploaded file
    files.sort(
      (a, b) =>
        fs.statSync(path.join(uploadsPath, b)).mtimeMs -
        fs.statSync(path.join(uploadsPath, a)).mtimeMs
    );

    const latestFile = files[0];
    const filePath = path.join(uploadsPath, latestFile);

    // --------------------------------
    // READ DATASET
    // --------------------------------

    let rows = [];

    // CSV
    if (latestFile.toLowerCase().endsWith(".csv")) {
      rows = await new Promise((resolve, reject) => {
        const data = [];

        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (row) => data.push(row))
          .on("end", () => resolve(data))
          .on("error", reject);
      });
    }

    // Excel
    else {
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
      });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return res.status(400).json({
          success: false,
          message: "The uploaded file does not contain any sheets.",
        });
      }

      const worksheet = workbook.Sheets[firstSheetName];

      rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });
    }

    // --------------------------------
    // ORIGINAL DATA
    // --------------------------------

    const originalRows = rows.length;

    const columns =
      rows.length > 0
        ? Object.keys(rows[0])
        : [];

    // --------------------------------
    // REMOVE COMPLETELY EMPTY ROWS
    // --------------------------------

    const nonEmptyRows = rows.filter((row) =>
      Object.values(row).some(
        (value) => String(value).trim() !== ""
      )
    );

    const emptyRowsRemoved =
      originalRows - nonEmptyRows.length;

    // --------------------------------
    // REMOVE DUPLICATE ROWS
    // --------------------------------

    const uniqueRows = [
      ...new Map(
        nonEmptyRows.map((row) => [
          JSON.stringify(row),
          row,
        ])
      ).values(),
    ];

    const duplicateRowsRemoved =
      nonEmptyRows.length - uniqueRows.length;

    // --------------------------------
    // MISSING VALUES
    // --------------------------------

    const missingValues = {};

    columns.forEach((column) => {
      missingValues[column] = uniqueRows.filter(
        (row) =>
          row[column] === "" ||
          row[column] === null ||
          row[column] === undefined
      ).length;
    });

    // --------------------------------
    // TOTAL REMOVED
    // --------------------------------

    const removedRows =
      originalRows - uniqueRows.length;

    // --------------------------------
    // RESPONSE
    // --------------------------------

    return res.status(200).json({
      success: true,

      fileName: latestFile,

      originalRows,

      cleanedRows: uniqueRows.length,

      removedRows,

      emptyRowsRemoved,

      duplicateRowsRemoved,

      totalColumns: columns.length,

      columns,

      missingValues,

      data: uniqueRows,
    });

  } catch (err) {
    console.error("CLEAN ERROR:", err);

    return res.status(500).json({
      success: false,
      message:
        err.message || "Failed to clean dataset.",
    });
  }
};