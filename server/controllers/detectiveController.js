const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.detectiveAI = async (req, res) => {
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
      .on("end", async () => {
        try {
          const prompt = `
You are an expert Data Analyst.

Analyze the following dataset:

${JSON.stringify(rows.slice(0, 20), null, 2)}

Provide:
1. Dataset Summary
2. Missing Values
3. Interesting Patterns
4. Data Quality Issues
5. Recommendations

Use simple bullet points.
`;

          const result = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
          });

          res.json({
            success: true,
            analysis: result.text,
          });
        } catch (error) {
          console.error(error);

          res.status(500).json({
            success: false,
            message: error.message,
          });
        }
      });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};