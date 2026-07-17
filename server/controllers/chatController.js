const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.chatAI = async (req, res) => {
  try {
    const { question, history = [] } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

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
You are Data Detective AI.

You are an intelligent AI Data Analyst.

Dataset Name:
${latestFile}

Columns:
${Object.keys(rows[0] || {}).join(", ")}

Sample Data:
${JSON.stringify(rows.slice(0, 30), null, 2)}

Previous Conversation:
${history.join("\n")}

User Question:
${question}

Instructions:
- Answer naturally.
- Answer ONLY using the uploaded dataset.
- If information is unavailable, clearly say so.
- If asked for insights, explain them.
- If asked for charts, recommend the best chart.
- Keep answers easy to understand.
`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
          });

          res.json({
            success: true,
            answer: response.text,
          });
        } catch (error) {
          console.error(error);

          res.status(500).json({
            success: false,
            message: error.message,
          });
        }
      });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};