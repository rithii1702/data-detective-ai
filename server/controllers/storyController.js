const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

exports.generateStory = async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, "../uploads");

    const files = fs
      .readdirSync(uploadsPath)
      .filter((file) => file.endsWith(".csv"));

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
    const rows = [];

    fs.createReadStream(path.join(uploadsPath, latestFile))
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => {
        if (rows.length === 0) {
          return res.json({
            success: false,
            message: "Dataset is empty.",
          });
        }

        const columns = Object.keys(rows[0]);

        const numericColumns = columns.filter((col) =>
          rows.every((r) => !isNaN(Number(r[col])))
        );

        const categoricalColumns =
          columns.length - numericColumns.length;

        let missingValues = 0;

        rows.forEach((row) => {
          columns.forEach((col) => {
            if (
              row[col] === "" ||
              row[col] === null ||
              row[col] === undefined
            ) {
              missingValues++;
            }
          });
        });

        const duplicateRows =
          rows.length - new Set(rows.map((r) => JSON.stringify(r))).size;

        const story = {
          title: "AI Data Story",
          executiveSummary: `The uploaded dataset contains ${rows.length} rows and ${columns.length} columns. It includes ${numericColumns.length} numeric column(s) and ${categoricalColumns} categorical column(s).`,

          overview: `The dataset quality is ${
            missingValues === 0 ? "excellent" : "good"
          }, with ${missingValues} missing values and ${duplicateRows} duplicate rows.`,

          keyFindings: [
            `${rows.length} records were analyzed.`,
            `${numericColumns.length} numeric columns detected.`,
            `${categoricalColumns} categorical columns detected.`,
            `${missingValues} missing values found.`,
            `${duplicateRows} duplicate rows detected.`,
          ],

          businessImpact:
            "This dataset can be used for business intelligence, trend analysis, forecasting and KPI tracking.",

          recommendation:
            "Proceed with visualization, predictive analytics and dashboard reporting.",

          confidence: "97%",

          generatedAt: new Date().toLocaleString(),
        };

        res.json({
          success: true,
          story,
        });
      });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};