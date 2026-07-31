const express = require("express");
const multer = require("multer");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AEM AI Metadata Assistant API is running"
  });
});

app.post("/api/analyze", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Please upload an image"
    });
  }

  // Mock response for Version 1.
  // Later this will come from an AI vision model.
  const metadata = {
    title: "Sample Asset",
    description: "AI-generated asset description will appear here.",
    altText: "AI-generated alt text will appear here.",
    tags: ["sample", "aem", "ai"],
    confidence: 0.95
  };

  res.json({
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    metadata
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AEM AI Metadata Assistant running on http://localhost:${PORT}`);
});