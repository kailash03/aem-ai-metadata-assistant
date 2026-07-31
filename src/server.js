const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AEM AI Metadata Assistant API is running",
  });
});

app.post("/api/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an image",
      });
    }

    const base64Image = req.file.buffer.toString("base64");

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Analyze this image as if it were an asset uploaded to Adobe Experience Manager Assets.

Return ONLY valid JSON in this format:

{
  "title": "short professional asset title",
  "description": "1-2 sentence asset description",
  "altText": "concise accessible alt text",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "classification": "asset category",
  "confidence": 0.95
}

Do not include markdown or additional explanation.
              `,
            },
            {
              type: "input_image",
              image_url: `data:${req.file.mimetype};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const rawResult = response.output_text;

    let metadata;

    try {
      metadata = JSON.parse(rawResult);
    } catch {
      return res.status(502).json({
        error: "AI returned invalid JSON",
        rawResult,
      });
    }

    res.json({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      metadata,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to analyze image",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `AEM AI Metadata Assistant running on http://localhost:${PORT}`
  );
});