const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
require("dotenv").config();

const {
  buildAemMetadata,
  sendMetadataToAem
} = require("./services/aemService");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(express.static("public"));

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

app.post("/api/approve", async (req, res) => {
  try {
    const approvedMetadata = req.body;

    const record = {
      id: `approval-${Date.now()}`,
      fileName: approvedMetadata.fileName,
      status: "APPROVED",
      approvedAt: new Date().toISOString(),

      metadata: {
        title: approvedMetadata.title,
        description: approvedMetadata.description,
        altText: approvedMetadata.altText,
        tags: approvedMetadata.tags,
        classification: approvedMetadata.classification,
        confidence: approvedMetadata.confidence
      }
    };

    const dataDirectory = path.join(__dirname, "../data");
    const dataFile = path.join(
      dataDirectory,
      "approved-metadata.json"
    );

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, {
        recursive: true
      });
    }

    let approvals = [];

    if (fs.existsSync(dataFile)) {
      const existingData =
        fs.readFileSync(dataFile, "utf8");

      if (existingData.trim()) {
        approvals = JSON.parse(existingData);
      }
    }

    approvals.push(record);

    fs.writeFileSync(
      dataFile,
      JSON.stringify(approvals, null, 2)
    );

    const aemMetadata = buildAemMetadata(record.metadata);

    console.log("AEM METADATA PAYLOAD:");
    console.log(aemMetadata);

    const assetPath =
  `/content/dam/ai-metadata-assistant/${record.fileName}`;

  const aemResult = await sendMetadataToAem(
    assetPath,
    aemMetadata
  );

    console.log("APPROVED METADATA SAVED:");
    console.log(record);

    res.status(201).json({
    success: true,
    message: "Metadata approved and processed successfully.",
    approval: record,
    aemMetadata: aemMetadata,
    aemResult: aemResult
  });

  } catch (error) {
    console.error(
      "Approval error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Unable to save approved metadata."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `AEM AI Metadata Assistant running on http://localhost:${PORT}`
  );
});