const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
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

    // Find latest uploaded file
    files.sort(
      (a, b) =>
        fs.statSync(path.join(uploadsPath, b)).mtimeMs -
        fs.statSync(path.join(uploadsPath, a)).mtimeMs
    );

    const latestFile = files[0];
    const filePath = path.join(uploadsPath, latestFile);

    // -----------------------------
    // CSV FILE
    // -----------------------------
    if (latestFile.toLowerCase().endsWith(".csv")) {
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          results.push(row);
        })
        .on("end", () => {
          const columns =
            results.length > 0
              ? Object.keys(results[0])
              : [];

          return res.status(200).json({
            success: true,
            fileName: latestFile,
            totalRows: results.length,
            totalColumns: columns.length,
            columns,
            data: results,
          });
        })
        .on("error", (err) => {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        });

      return;
    }

    // -----------------------------
    // EXCEL FILE
    // -----------------------------
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

    const results = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    const columns =
      results.length > 0
        ? Object.keys(results[0])
        : [];

    return res.status(200).json({
      success: true,
      fileName: latestFile,
      totalRows: results.length,
      totalColumns: columns.length,
      columns,
      data: results,
    });

  } catch (err) {
    console.error("EXPLORER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load dataset.",
    });
  }
};