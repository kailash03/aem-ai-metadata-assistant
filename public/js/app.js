const imageInput =
  document.getElementById("imageInput");

const preview =
  document.getElementById("preview");

const fileName =
  document.getElementById("fileName");

const analyzeButton =
  document.getElementById("analyzeButton");

const approveButton =
  document.getElementById("approveButton");

const resetButton =
  document.getElementById("resetButton");

const metadataSection =
  document.getElementById("metadataSection");

const emptyState =
  document.getElementById("emptyState");

const status =
  document.getElementById("status");

const aemSyncResult =
  document.getElementById("aemSyncResult");

const aemSyncStatus =
  document.getElementById("aemSyncStatus");

const aemAssetPath =
  document.getElementById("aemAssetPath");

const confidenceWarning =
  document.getElementById("confidenceWarning");

const confidenceWarningText =
  document.getElementById("confidenceWarningText");


/*
 * IMAGE SELECTION
 */

imageInput.addEventListener(
  "change",
  () => {

    const file =
      imageInput.files[0];

    if (!file) {
      return;
    }

    preview.src =
      URL.createObjectURL(file);

    preview.style.display =
      "block";

    fileName.textContent =
      file.name;

    clearMetadata();

    metadataSection.style.display =
      "none";

    emptyState.style.display =
      "block";

    resetAemSync();

    resetConfidenceWarning();

    clearStatus();

  }
);


/*
 * ANALYZE ASSET
 */

analyzeButton.addEventListener(
  "click",
  async () => {

    const file =
      imageInput.files[0];

    if (!file) {

      showStatus(
        "Please select an image first.",
        "error"
      );

      return;
    }

    analyzeButton.disabled =
      true;

    analyzeButton.textContent =
      "Analyzing...";

    showStatus(
      "AI is analyzing the asset...",
      "info"
    );

    resetConfidenceWarning();
    resetAemSync();

    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    try {

      const response =
        await fetch(
          "/api/analyze",
          {
            method: "POST",
            body: formData
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.details ||
          data.error ||
          "Analysis failed"
        );

      }

      populateMetadata(
        data.metadata
      );

      /*
       * CHECK AI CONFIDENCE
       */

      updateConfidenceWarning(
        data.confidenceEvaluation
      );

      emptyState.style.display =
        "none";

      metadataSection.style.display =
        "block";

      approveButton.textContent =
        "✓ Approve Metadata";

      showStatus(
        "✓ AI suggestions generated. Review before approval.",
        "success"
      );

    } catch (error) {

      showStatus(
        "Analysis failed: " +
        error.message,
        "error"
      );

    } finally {

      analyzeButton.disabled =
        false;

      analyzeButton.textContent =
        "✨ Analyze with AI";

    }

  }
);


/*
 * APPROVE METADATA
 */

approveButton.addEventListener(
  "click",
  async () => {

    const approvedMetadata =
      getMetadataFromForm();

    approveButton.disabled =
      true;

    approveButton.textContent =
      "Approving...";

    try {

      const response =
        await fetch(
          "/api/approve",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                approvedMetadata
              )
          }
        );

      const data =
        await response.json();

      /*
       * HANDLE VALIDATION / API ERRORS
       */

      if (!response.ok) {

        const validationErrors =
          Array.isArray(data.errors)
            ? data.errors.join(" ")
            : "";

        throw new Error(
          validationErrors ||
          data.message ||
          data.error ||
          "Approval failed"
        );

      }

      showStatus(
        "✓ Metadata approved successfully.",
        "success"
      );

      approveButton.textContent =
        "✓ Approved";


      /*
       * DISPLAY AEM SYNC RESULT
       */

      if (data.aemResult?.success) {

        aemSyncResult.style.display =
          "block";

        aemSyncStatus.textContent =
          data.aemResult.mode === "mock"
            ? "Simulated successfully (Mock Mode)"
            : "Synced successfully";

        aemAssetPath.textContent =
          data.aemResult.assetPath || "--";

      }

    } catch (error) {

      showStatus(
        "Approval failed: " +
        error.message,
        "error"
      );

      approveButton.textContent =
        "✓ Approve Metadata";

    } finally {

      approveButton.disabled =
        false;

    }

  }
);


/*
 * RESET
 */

resetButton.addEventListener(
  "click",
  () => {

    imageInput.value =
      "";

    preview.src =
      "";

    preview.style.display =
      "none";

    fileName.textContent =
      "Select an image to begin";

    clearMetadata();

    metadataSection.style.display =
      "none";

    emptyState.style.display =
      "block";

    approveButton.textContent =
      "✓ Approve Metadata";

    resetAemSync();

    resetConfidenceWarning();

    clearStatus();

  }
);


/*
 * POPULATE AI METADATA
 */

function populateMetadata(metadata) {

  document
    .getElementById("title")
    .value =
    metadata.title || "";

  document
    .getElementById("description")
    .value =
    metadata.description || "";

  document
    .getElementById("altText")
    .value =
    metadata.altText || "";

  document
    .getElementById("tags")
    .value =
    Array.isArray(metadata.tags)
      ? metadata.tags.join(", ")
      : metadata.tags || "";

  document
    .getElementById("classification")
    .value =
    metadata.classification || "";

  const confidence =
    Number(metadata.confidence);

  document
    .getElementById("confidence")
    .textContent =
    Number.isFinite(confidence)
      ? Math.round(confidence * 100) + "%"
      : "--";

}


/*
 * GET HUMAN-REVIEWED METADATA
 */

function getMetadataFromForm() {

  return {

    fileName:
      imageInput.files[0]?.name || "",

    title:
      document
        .getElementById("title")
        .value
        .trim(),

    description:
      document
        .getElementById("description")
        .value
        .trim(),

    altText:
      document
        .getElementById("altText")
        .value
        .trim(),

    tags:
      document
        .getElementById("tags")
        .value
        .split(",")
        .map(
          tag => tag.trim()
        )
        .filter(Boolean),

    classification:
      document
        .getElementById("classification")
        .value
        .trim(),

    confidence:
      document
        .getElementById("confidence")
        .textContent

  };

}


/*
 * CLEAR METADATA
 */

function clearMetadata() {

  document
    .getElementById("title")
    .value = "";

  document
    .getElementById("description")
    .value = "";

  document
    .getElementById("altText")
    .value = "";

  document
    .getElementById("tags")
    .value = "";

  document
    .getElementById("classification")
    .value = "";

  document
    .getElementById("confidence")
    .textContent = "--";

}


/*
 * UPDATE CONFIDENCE WARNING
 */

function updateConfidenceWarning(
  evaluation
) {

  if (
    !confidenceWarning ||
    !confidenceWarningText
  ) {
    return;
  }

  if (!evaluation) {

    resetConfidenceWarning();

    return;
  }

  if (evaluation.lowConfidence) {

    const score =
      Math.round(
        evaluation.score * 100
      );

    const threshold =
      Math.round(
        evaluation.threshold * 100
      );

    confidenceWarning.style.display =
      "block";

    confidenceWarningText.textContent =
      `AI confidence is ${score}%. ` +
      `The review threshold is ${threshold}%. ` +
      `Please review the generated metadata carefully before approval.`;

  } else {

    resetConfidenceWarning();

  }

}


/*
 * RESET CONFIDENCE WARNING
 */

function resetConfidenceWarning() {

  if (!confidenceWarning) {
    return;
  }

  confidenceWarning.style.display =
    "none";

  if (confidenceWarningText) {

    confidenceWarningText.textContent =
      "Review these AI suggestions carefully before approval.";

  }

}


/*
 * RESET AEM SYNC
 */

function resetAemSync() {

  if (!aemSyncResult) {
    return;
  }

  aemSyncResult.style.display =
    "none";

  if (aemSyncStatus) {

    aemSyncStatus.textContent =
      "Waiting for approval";

  }

  if (aemAssetPath) {

    aemAssetPath.textContent =
      "--";

  }

}


/*
 * STATUS MESSAGE
 */

function showStatus(
  message,
  type
) {

  status.textContent =
    message;

  status.className =
    "status-" + type;

}


/*
 * CLEAR STATUS
 */

function clearStatus() {

  status.textContent =
    "";

  status.className =
    "";

}