/**
 * Converts approved AI metadata into an AEM-style metadata structure.
 *
 * Later this service will also be responsible for communicating
 * with AEM Assets.
 */
function buildAemMetadata(metadata) {
  return {
    "dc:title": metadata.title || "",
    "dc:description": metadata.description || "",
    "dc:subject": Array.isArray(metadata.tags)
      ? metadata.tags
      : [],
    "dam:altText": metadata.altText || "",

    // Custom metadata properties for our AI workflow
    "aemai:classification": metadata.classification || "",
    "aemai:confidence": metadata.confidence || "",
    "aemai:reviewStatus": "APPROVED",
    "aemai:generatedBy": "AEM AI Metadata Assistant",
    "aemai:approvedAt": new Date().toISOString()
  };
}

async function sendMetadataToAem(assetPath, metadata) {
  const mockMode = process.env.AEM_MOCK_MODE !== "false";

  if (mockMode) {
    console.log("=================================");
    console.log("AEM MOCK MODE");
    console.log("Asset Path:", assetPath);
    console.log("Metadata that would be sent to AEM:");
    console.log(metadata);
    console.log("=================================");

    return {
      success: true,
      mode: "mock",
      assetPath,
      message: "Metadata successfully simulated for AEM."
    };
  }

  // Real AEM integration will be implemented next.
  throw new Error(
    "Real AEM integration is not configured yet."
  );
}

function validateMetadata(metadata) {
  const errors = [];

  if (!metadata.title?.trim()) {
    errors.push("Title is required.");
  }

  if (!metadata.description?.trim()) {
    errors.push("Description is required.");
  }

  if (!metadata.altText?.trim()) {
    errors.push("Alt text is required for accessibility.");
  }

  if (
    !Array.isArray(metadata.tags) ||
    metadata.tags.length === 0
  ) {
    errors.push("At least one tag is required.");
  }

  if (!metadata.classification?.trim()) {
    errors.push("Classification is required.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  buildAemMetadata,
  sendMetadataToAem,
  validateMetadata
};