# AEM AI Metadata Assistant

An AI-assisted metadata workflow for Adobe Experience Manager (AEM) Assets that generates metadata suggestions from uploaded images while keeping a human reviewer in control of what is ultimately approved and sent to AEM.

The project demonstrates how AI can support DAM authoring workflows without automatically publishing AI-generated metadata.

---

## Overview

Managing metadata across a large Digital Asset Management system can require significant manual effort.

Authors may need to create:

- Asset titles
- Descriptions
- Accessible alt text
- Tags
- Asset classifications

The **AEM AI Metadata Assistant** uses AI to generate these metadata suggestions from image assets.

Instead of automatically writing AI output into AEM, the application introduces a **human-in-the-loop review and approval workflow**.

```text
Upload Assets
      ↓
AI Analysis
      ↓
Metadata Suggestions
      ↓
Human Review / Edit
      ↓
Approval
      ↓
AEM Metadata Mapping
      ↓
AEM Assets / DAM
```

---

## Key Features

### AI-Assisted Metadata Generation

Uploaded images are analyzed using AI to generate:

- Title
- Description
- Accessible alt text
- Tags
- Classification
- Confidence score

### Bulk Asset Processing

Multiple image assets can be selected and analyzed as a batch.

Each asset maintains its own:

- AI-generated metadata
- Confidence evaluation
- Review status
- Approval status
- AEM synchronization result

### Asset Queue

The UI provides an asset queue showing the current status of every uploaded image.

Example:

```text
Asset 1    ● Awaiting Review
Asset 2    ✓ Approved
Asset 3    ● Awaiting Review
```

Authors can select an individual asset to review its generated metadata.

### Remove Assets

Unwanted assets can be removed from the batch before processing or during review.

Asset removal is disabled while AI batch analysis is actively running to prevent changes to the processing queue.

### Human Review and Editing

AI output is treated as a suggestion rather than final metadata.

Before approval, the user can edit:

- Title
- Description
- Alt text
- Tags
- Classification

Human changes are preserved independently for each asset.

### Confidence Evaluation

AI-generated metadata includes a confidence score.

The application evaluates the confidence and can display a warning when additional human review is recommended.

This provides an additional guardrail before metadata approval.

### Per-Asset Approval

Each asset has its own approval state.

Once an asset is approved:

```text
✓ Approved
```

The approval action is disabled for that asset while other assets can continue through review independently.

### Batch Summary

The interface tracks the overall batch state, including:

- Total assets
- Analyzed assets
- Approved assets
- Assets awaiting review

This provides visibility into the progress of a multi-asset metadata workflow.

---

## Architecture

```text
                    ┌─────────────────┐
                    │  Asset Upload   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  AI Analysis    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Metadata        │
                    │ Suggestions     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Human Review    │
                    │ & Editing       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Approval     │
                    └───────┬─────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
      ┌─────────────────┐       ┌─────────────────┐
      │ Persist         │       │ AEM Metadata    │
      │ Approval        │       │ Mapper          │
      └─────────────────┘       └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │ AEM Delivery    │
                               │ Service         │
                               └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │ AEM Assets /    │
                               │ DAM             │
                               └─────────────────┘
```

---

## Human-in-the-Loop Approach

The project intentionally does **not** automatically write AI-generated metadata into AEM.

AI generates metadata suggestions first.

The author then reviews the generated values and can modify them before approval.

Only approved metadata moves into the AEM integration layer.

This approach provides guardrails around:

- Metadata quality
- Accessibility
- Brand consistency
- Incorrect AI-generated information
- Low-confidence AI output
- DAM metadata standards

The AI assists the author rather than replacing the author.

---

## AI Metadata Response

The AI analysis layer generates structured metadata similar to:

```json
{
  "title": "Panoramic Coastal Cliffs and Ravine",
  "description": "Wide-angle landscape of eroded sandstone cliffs with a ravine opening toward the sea.",
  "altText": "Panoramic view of coastal cliffs and a ravine leading toward the ocean.",
  "tags": [
    "coastal cliffs",
    "sandstone",
    "canyon",
    "ocean horizon",
    "geology"
  ],
  "classification": "Landscape photography",
  "confidence": 0.95
}
```

Structured output makes the AI response easier to validate, review and map into DAM metadata fields.

---

## AEM Metadata Mapping

After human approval, application metadata is transformed into an AEM-oriented metadata structure.

Example:

```json
{
  "dc:title": "Panoramic Coastal Cliffs and Ravine",
  "dc:description": "Wide-angle landscape of eroded sandstone cliffs with a ravine opening toward the sea.",
  "dc:subject": [
    "coastal cliffs",
    "sandstone",
    "canyon",
    "ocean horizon",
    "geology"
  ],
  "dam:altText": "Panoramic view of coastal cliffs and a ravine leading toward the ocean.",
  "aemai:classification": "Landscape photography",
  "aemai:confidence": "95%",
  "aemai:reviewStatus": "APPROVED",
  "aemai:generatedBy": "AEM AI Metadata Assistant"
}
```

This separates AI generation from the AEM-specific integration layer.

---

## AEM Integration Layer

The AEM integration logic is isolated in:

```text
src/services/aemService.js
```

The service layer is responsible for:

```text
Human-Approved Metadata
        ↓
Metadata Validation
        ↓
AEM Metadata Mapping
        ↓
AEM Delivery
```

This design allows the AI workflow to remain independent of the final AEM connectivity implementation.

---

## AEM Mock Mode

The project currently supports an AEM mock integration mode.

```env
AEM_MOCK_MODE=true
```

Mock mode allows the complete workflow to be demonstrated without requiring an active AEM environment or AEM credentials.

Example simulated DAM path:

```text
/content/dam/ai-metadata-assistant/example.jpg
```

Each approved asset maintains its own AEM synchronization result and simulated DAM path.

Real AEM connectivity can later be implemented through the same AEM service layer.

---

## Approval Persistence

Approved metadata is persisted separately from the AI-generated suggestions.

Example approval information includes:

```json
{
  "status": "APPROVED",
  "approvedAt": "2026-08-13T21:30:57.144Z"
}
```

This demonstrates a separation between:

```text
AI Suggestion
      ↓
Human Decision
      ↓
Approved Metadata
```

---

## Technology Stack

### Backend

- Node.js
- Express
- JavaScript
- Multer

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### AI

- OpenAI API
- Image analysis
- Structured metadata generation

### AEM / DAM Concepts

- Adobe Experience Manager Assets
- DAM metadata
- Dublin Core metadata
- Metadata mapping
- Asset approval workflow
- Human-in-the-loop content operations

---

## Project Structure

```text
aem-ai-metadata-assistant/
│
├── data/
│   └── approved-metadata.json
│
├── public/
│   ├── css/
│   │   └── styles.css
│   │
│   ├── js/
│   │   └── app.js
│   │
│   └── index.html
│
├── src/
│   ├── services/
│   │   └── aemService.js
│   │
│   └── server.js
│
├── .gitignore
├── package.json
└── README.md
```

---

## Environment Configuration

Create a local `.env` file:

```env
OPENAI_API_KEY=your_key_here
AEM_MOCK_MODE=true
```

Do not commit API keys, credentials or the `.env` file to source control.

---

## Run Locally

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Application Workflow

```text
Select Multiple Assets
        ↓
Remove Unwanted Assets
        ↓
Analyze Batch with AI
        ↓
AI Metadata Generated
        ↓
Select Individual Asset
        ↓
Review Confidence
        ↓
Review / Edit Metadata
        ↓
Approve Asset
        ↓
Persist Approval
        ↓
Map Metadata for AEM
        ↓
AEM Sync / Mock Sync
```

---

## AI Guardrails

The application demonstrates several controls around AI-generated metadata:

1. AI output follows a predefined structured metadata format.
2. Metadata is reviewed before approval.
3. Authors can modify AI-generated values.
4. Confidence evaluation can flag output requiring additional review.
5. Only approved metadata reaches the AEM integration layer.
6. Approval status is maintained independently for each asset.
7. AI generation and AEM delivery are separated into different application layers.

---

## Current Status

The current prototype supports:

- Multi-asset upload
- Asset removal
- Sequential batch AI analysis
- AI metadata generation
- Structured metadata output
- Per-asset metadata state
- Per-asset confidence evaluation
- Human review and editing
- Per-asset approval
- Batch progress summary
- Approval persistence
- AEM metadata mapping
- Per-asset AEM synchronization state
- Mock AEM DAM integration

---

## Roadmap

Potential future enhancements include:

- Real AEM Assets integration
- OAuth / secure AEM authentication
- Configurable AEM metadata schemas
- AEM metadata profile integration
- Role-based approval workflows
- Approval history and audit trail
- Configurable confidence thresholds
- Advanced accessibility validation
- Duplicate and taxonomy-aware tag detection
- Parallel/background asset processing
- Retry handling for failed AI analysis
- Production logging and monitoring

---

## Why This Project?

The goal is not simply to demonstrate AI image analysis.

The project explores how AI can fit into a practical **AEM Assets workflow** where AI assists with repetitive metadata creation while human reviewers retain control over quality and final approval.

The architecture is designed so that AI generation, human review and AEM delivery remain separate responsibilities.

---

## Author

**Kailash Ramagiri**

AEM • AEM as a Cloud Service • AEM Assets / DAM • AI-Assisted Content Workflows

© 2026 Kailash Ramagiri. All Rights Reserved.