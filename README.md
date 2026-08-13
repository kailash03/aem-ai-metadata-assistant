## Architecture

```text
Asset Upload
     |
     v
AI Image Analysis
     |
     v
Metadata Suggestions
     |
     v
Human Review / Edit
     |
     v
Approval
     |
     +--------------------+
     |                    |
     v                    v
Persist Approval     AEM Metadata Mapper
                          |
                          v
                    AEM Delivery Service
                          |
                          v
                   AEM Assets / DAM
```

## Human-in-the-Loop Approach

The project intentionally does not automatically write AI-generated metadata into AEM.

AI produces suggestions.

The author can review and modify those suggestions before approval.

Only approved metadata moves into the AEM integration layer.

This approach helps support content quality, accessibility, brand consistency, and governance.

## AEM Metadata Mapping

Approved metadata is transformed into an AEM-oriented structure including fields such as:

```json
{
  "dc:title": "Asset title",
  "dc:description": "Asset description",
  "dc:subject": ["tag1", "tag2"],
  "dam:altText": "Accessible image description",
  "aemai:classification": "Landscape photography",
  "aemai:confidence": "95%",
  "aemai:reviewStatus": "APPROVED"
}
```

## AEM Mock Mode

The project currently supports an AEM mock integration mode.

```env
AEM_MOCK_MODE=true
```

This allows the complete workflow to be demonstrated without requiring AEM credentials.

Example simulated asset path:

```text
/content/dam/ai-metadata-assistant/example.jpg
```

Real AEM connectivity can be added through the AEM service layer.

## Technology

- Node.js
- Express
- JavaScript
- HTML
- CSS
- OpenAI API
- Adobe Experience Manager Assets concepts
- Dublin Core metadata mapping

## Project Structure

```text
aem-ai-metadata-assistant/
├── data/
│   └── approved-metadata.json
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── src/
│   ├── services/
│   │   └── aemService.js
│   └── server.js
├── .gitignore
├── package.json
└── README.md
```

## Environment Configuration

Create a `.env` file locally:

```env
OPENAI_API_KEY=your_key_here
AEM_MOCK_MODE=true
```

Never commit your actual API key or `.env` file.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Current Workflow

```text
Upload
→ AI Analysis
→ Metadata Suggestions
→ Human Review
→ Approval
→ Persistence
→ AEM Metadata Mapping
→ AEM Sync
```

## Roadmap

- Real AEM Assets integration
- Secure AEM authentication
- Configurable metadata schemas
- Bulk asset processing
- Approval history
- Confidence threshold rules
- Accessibility validation
- Duplicate tag detection

## Author

**Kailash Ramagiri**

AEM • AEM as a Cloud Service • DAM • AI-assisted content workflows

© 2026 Kailash Ramagiri. All Rights Reserved.