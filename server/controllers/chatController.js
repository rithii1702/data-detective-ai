const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const {
  getDatasetFilePath,
  parseDatasetRows,
  computeDatasetMetrics,
  classifyQuestion,
  buildDatasetPromptContext,
  detectAndGenerateChart,
} = require("../services/dataRagService");
const {
  processDataAnalysis,
  inspectColumnTypes,
} = require("../services/dataAnalysisEngine");

// Ensure environment variables are loaded
const envPath = fs.existsSync(path.resolve(__dirname, "../.env"))
  ? path.resolve(__dirname, "../.env")
  : path.resolve(process.cwd(), "server/.env");
dotenv.config({ path: envPath });

// Preferred model and fallback list supported by Gemini Interactions API
const CANDIDATE_MODELS = [
  "gemini-3.5-flash",       // Preferred by user
  "gemini-3.5-flash-lite",  // Fast, reliable Interactions API model
  "gemini-3.6-flash",       // High capability Interactions API model
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemma-4-26b-a4b-it",
];

let lastSuccessfulModel = null;

// In-memory cache for parsed dataset metrics to avoid re-reading disk on every request
let cachedMetrics = null;
let cachedFileMtime = 0;
let cachedFilePath = "";

function getCachedOrComputeMetrics(filePath) {
  if (!filePath) return null;

  try {
    const stats = fs.statSync(filePath);
    if (
      cachedMetrics &&
      cachedFilePath === filePath &&
      cachedFileMtime === stats.mtimeMs
    ) {
      return cachedMetrics;
    }

    const rows = parseDatasetRows(filePath);
    if (rows && rows.length > 0) {
      const fileName = path.basename(filePath);
      cachedMetrics = computeDatasetMetrics(rows, fileName);
      cachedFileMtime = stats.mtimeMs;
      cachedFilePath = filePath;
      return cachedMetrics;
    }
  } catch (err) {
    console.warn("⚠️ Could not compute dataset metrics:", err.message);
  }

  return null;
}

/**
 * Extract assistant text from Gemini Interactions API response steps
 */
function extractAnswer(data) {
  if (!data) return null;

  // 1. Search steps for model_output
  if (Array.isArray(data.steps)) {
    const outputSteps = data.steps.filter((s) => s.type === "model_output");
    const texts = [];
    for (const step of outputSteps) {
      if (Array.isArray(step.content)) {
        for (const part of step.content) {
          if (part && typeof part.text === "string") {
            texts.push(part.text);
          }
        }
      } else if (typeof step.content === "string") {
        texts.push(step.content);
      }
    }
    if (texts.length > 0) {
      return texts.join("\n").trim();
    }
  }

  // 2. Legacy / fallback candidates format
  if (Array.isArray(data.candidates) && data.candidates[0]?.content?.parts) {
    return data.candidates[0].content.parts
      .map((p) => p.text || "")
      .join("")
      .trim();
  }

  // 3. Direct text property
  if (typeof data.text === "string") return data.text.trim();
  if (typeof data.output === "string") return data.output.trim();

  return null;
}

/**
 * Main chat controller handler
 */
exports.chatAI = async (req, res) => {
  try {
    const question =
      req.body?.message ||
      req.body?.question ||
      req.body?.prompt ||
      "";

    const cleanQuestion = typeof question === "string" ? question.trim() : "";

    // 1. Validate question exists
    if (!cleanQuestion) {
      return res.status(400).json({
        success: false,
        error: "Please enter a question.",
        answer: "Please enter a question.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is not configured in server/.env");
      return res.status(500).json({
        success: false,
        error: "Gemini API key is missing on the server. Please check server/.env.",
        answer: "Gemini API key is missing on the server. Please check server/.env.",
      });
    }

    const previousInteractionId =
      req.body?.previousInteractionId ||
      req.body?.previous_interaction_id ||
      null;

    const datasetId =
      req.body?.datasetId ||
      req.body?.datasetFile ||
      req.body?.fileName ||
      null;

    // 2. Locate and load dataset if available
    const datasetFilePath = getDatasetFilePath(datasetId);
    const metrics = datasetFilePath
      ? getCachedOrComputeMetrics(datasetFilePath)
      : null;

    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const rawRows = datasetFilePath ? parseDatasetRows(datasetFilePath) : [];
    const fileName = datasetFilePath ? path.basename(datasetFilePath) : "dataset";

    // 1. Run Data Analysis Engine on the dataset
    let analysisResult = null;
    if (rawRows.length > 0) {
      try {
        analysisResult = processDataAnalysis(cleanQuestion, history, rawRows, fileName);
      } catch (err) {
        console.warn("⚠️ Data Analysis Engine error:", err.message);
      }
    }

    // 2. Check if user requested a visualization
    let chart = null;
    const isExplicitChartWord =
      /\b(chart|graph|plot|visualize|visualization|diagram)\b/i.test(cleanQuestion) ||
      /\bshow me\b/i.test(cleanQuestion);

    if (rawRows.length > 0) {
      try {
        chart = detectAndGenerateChart(cleanQuestion, history, rawRows);
      } catch (chartErr) {
        console.warn("⚠️ Chart generation warning:", chartErr.message);
      }
    } else if (isExplicitChartWord) {
      return res.status(200).json({
        success: true,
        answer:
          "No uploaded dataset was found. Please upload a dataset in CSV or Excel format first so I can generate charts and visualizations for you.",
        chart: null,
      });
    }

    // 3. Classify question: "dataset", "general", or "ambiguous_dataset"
    const questionType = classifyQuestion(
      cleanQuestion,
      metrics ? metrics.columns : [],
      !!metrics
    );

    // 4. Construct Prompt based on Classification & Conversation State
    let inputPrompt = "";

    const generalSystemPrompt = `You are Detective AI, a helpful general-purpose AI assistant inside a data analytics application.

Answer the user's questions naturally and clearly like a ChatGPT-style assistant.
You are not restricted to dataset questions.
For general questions (programming, SQL, MongoDB, Python, machine learning, recursion, APIs, system architecture, etc.), provide direct, thorough, and clear explanations with code examples and steps where helpful.
If the user asks how something works (e.g. "how does it work?"), explain it step by step.
Be conversational, accurate and helpful.`;

    if (questionType === "general") {
      // General question: do not inject dataset calculations
      if (previousInteractionId) {
        inputPrompt = cleanQuestion;
      } else {
        inputPrompt = `${generalSystemPrompt}\n\n[USER QUESTION]:\n${cleanQuestion}`;
      }
    } else {
      // Dataset question or ambiguous follow-up: inject verified RAG context
      const datasetRAGContext = buildDatasetPromptContext(metrics);

      const datasetSystemPrompt = `You are Detective AI, a helpful AI assistant and expert data analyst inside Data Detective AI / Data Storyteller.

Answer the user's questions about their uploaded dataset using the verified calculations provided below.
- Always use the exact calculations and numbers provided.
- Do NOT guess, hallucinate, or fabricate any numbers, columns, or rows.
- If asking about the highest revenue, clearly state both the top product total revenue and the single highest transaction if applicable.
- If asking about units sold vs revenue, distinguish between quantity sold and total revenue.
- If a calculation or metric is not present in the dataset, clearly state that it is not available.
- Present answers in clear, well-structured markdown with bold numbers and bullet points.`;

      if (previousInteractionId) {
        inputPrompt = `${datasetRAGContext}\n\n[USER FOLLOW-UP QUESTION]:\n${cleanQuestion}`;
      } else {
        inputPrompt = `${datasetSystemPrompt}\n\n${datasetRAGContext}\n\n[USER QUESTION]:\n${cleanQuestion}`;
      }

      if (analysisResult && analysisResult.calculated) {
        const analysisPrompt = `\n\n### [DATA ANALYSIS ENGINE - VERIFIED GROUND TRUTH CALCULATION]:\n` +
          `Target Analysis: ${analysisResult.intent}\n` +
          (analysisResult.targetColumn ? `Target Column: ${analysisResult.targetColumn}\n` : "") +
          `${analysisResult.fallbackText}\n\n` +
          `CRITICAL INSTRUCTIONS FOR DETECTIVE AI:\n` +
          `- The calculation above was pre-computed with 100% mathematical precision directly from the user's uploaded dataset.\n` +
          `- Cite these exact numbers, averages, medians, totals, percentages, outliers, and threshold values in your answer.\n` +
          `- Answer conversationally in ChatGPT-style with bold highlights, bullets, and friendly insights.\n` +
          `- Do NOT recalculate or invent any different numbers.`;

        inputPrompt += analysisPrompt;
      }
    }

    if (chart) {
      const chartDirective = `\n\n[DETECTIVE AI DATA VISUALIZATION GENERATED]:
Chart Type: ${chart.type}
Title: ${chart.title}
Data:
${JSON.stringify(chart.data, null, 2)}

Instructions for Detective AI:
- Introduce and provide a concise analysis of this chart for the user.
- Highlight key insights (highest value, lowest value, totals, or trends) referencing the exact numbers shown in the chart data.
- The interactive chart is already rendered in the UI directly below your answer, so do NOT attempt to print raw JSON tables or ASCII charts.`;

      inputPrompt += chartDirective;
    }

    // 5. Select candidate models (prioritizing user-requested gemini-3.5-flash or last known working)
    let candidateModels = [...CANDIDATE_MODELS];
    if (lastSuccessfulModel && candidateModels.includes(lastSuccessfulModel)) {
      candidateModels = [
        lastSuccessfulModel,
        ...candidateModels.filter((m) => m !== lastSuccessfulModel),
      ];
    }

    let lastError = null;
    let answer = null;
    let modelUsed = null;
    let interactionId = null;

    // 6. Call Gemini Interactions API
    for (const model of candidateModels) {
      const interactionUrl = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;

      const requestPayload = {
        model,
        input: inputPrompt,
      };

      if (previousInteractionId) {
        requestPayload.previous_interaction_id = previousInteractionId;
      }

      try {
        let response = await fetch(interactionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        let data = await response.json();

        // If previous_interaction_id was expired or rejected (HTTP 400), retry fresh without it
        if (!response.ok && response.status === 400 && previousInteractionId) {
          console.warn(
            `⚠️ previous_interaction_id ${previousInteractionId} rejected for ${model}. Retrying fresh...`
          );
          const freshPayload = {
            model,
            input: inputPrompt,
          };
          response = await fetch(interactionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(freshPayload),
          });
          data = await response.json();
        }

        if (response.ok) {
          const extractedText = extractAnswer(data);
          if (extractedText) {
            answer = extractedText;
            interactionId = data.id || null;
            modelUsed = model;
            lastSuccessfulModel = model;
            break;
          }
        }

        console.warn(
          `⚠️ Gemini Interactions API model ${model} returned HTTP ${response.status}:`,
          data?.error?.message || data
        );

        lastError = {
          status: response.status,
          data,
        };

        // If 401 or 403, key is unauthorized/invalid: don't loop
        if (response.status === 401 || response.status === 403) {
          break;
        }

        // For 429 (rate limit) or 503 (demand spike) or 404, fall through to next candidate model
      } catch (networkErr) {
        console.warn(
          `⚠️ Network error calling Gemini Interactions API with model ${model}:`,
          networkErr.message
        );
        lastError = {
          status: 500,
          data: { error: { message: networkErr.message } },
        };
      }
    }

    // 7. If successful, return { success: true, answer, interactionId, model, chart }
    if (answer) {
      return res.status(200).json({
        success: true,
        answer,
        interactionId,
        model: modelUsed,
        chart: chart || null,
      });
    }

    // Safety fallback: if analysis was calculated, return verified answer directly!
    if (!answer && analysisResult && analysisResult.calculated && analysisResult.fallbackText) {
      return res.status(200).json({
        success: true,
        answer: analysisResult.fallbackText,
        chart: chart || null,
        calculated: true,
      });
    }

    // Safety fallback: if chart was calculated but model failed
    if (!answer && chart) {
      return res.status(200).json({
        success: true,
        answer: `Here is the ${chart.title} based on your uploaded dataset.`,
        chart,
      });
    }

    // 8. If all models failed, log the REAL error and return appropriate HTTP status
    console.error(
      "❌ Gemini Interactions API failed for all candidate models. Last status:",
      lastError?.status,
      "Details:",
      JSON.stringify(lastError?.data, null, 2)
    );

    const status = lastError?.status || 500;
    const rawErrorMessage =
      lastError?.data?.error?.message || "Failed to communicate with Gemini Interactions API.";

    let clientMessage = rawErrorMessage;
    if (status === 401 || status === 403) {
      clientMessage = "Gemini API key is invalid or unauthorized. Please check server/.env.";
    } else if (status === 429) {
      clientMessage = "Gemini API rate limit or quota exceeded. Please wait a moment and try again.";
    } else if (status === 503) {
      clientMessage = "Gemini AI models are currently experiencing high demand. Please try again shortly.";
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      error: clientMessage,
      answer: clientMessage,
    });
  } catch (err) {
    console.error("❌ Unexpected Detective AI controller error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "An unexpected error occurred in Detective AI.",
      answer: "I couldn't process your request due to an internal server error.",
    });
  }
};