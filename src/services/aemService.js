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

module.exports = {
  buildAemMetadata
};