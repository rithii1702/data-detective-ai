const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const uploadRoutes = require("./routes/uploadRoutes");
const explorerRoutes = require("./routes/explorerRoutes");
const cleanRoutes = require("./routes/cleanRoutes");
const edaRoutes = require("./routes/edaRoutes");
const insightRoutes = require("./routes/insightRoutes");
const storyRoutes = require("./routes/storyRoutes");
const historyRoutes = require("./routes/historyRoutes");
const deleteRoutes = require("./routes/deleteRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const detectiveRoutes = require("./routes/detectiveRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/explorer", explorerRoutes);
app.use("/api/clean", cleanRoutes);
app.use("/api/eda", edaRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/delete", deleteRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/detective", detectiveRoutes);
app.use("/api/chat", chatRoutes);

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Data Detective AI Backend is Running",
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});