const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const fileName = document.getElementById("fileName");
const analyzeButton = document.getElementById("analyzeButton");
const approveButton = document.getElementById("approveButton");
const resetButton = document.getElementById("resetButton");
const metadataSection = document.getElementById("metadataSection");
const emptyState = document.getElementById("emptyState");
const status = document.getElementById("status");
const aemSyncResult = document.getElementById("aemSyncResult");
const aemSyncStatus = document.getElementById("aemSyncStatus");
const aemAssetPath = document.getElementById("aemAssetPath");
const confidenceWarning = document.getElementById("confidenceWarning");
const confidenceWarningText = document.getElementById("confidenceWarningText");
const assetQueue = document.getElementById("assetQueue");
const assetCount = document.getElementById("assetCount");
const assetQueueList = document.getElementById("assetQueueList");
const summaryTotal = document.getElementById("summaryTotal");
const summaryAnalyzed = document.getElementById("summaryAnalyzed");
const summaryApproved = document.getElementById("summaryApproved");
const summaryReview = document.getElementById("summaryReview");

/*
 * BULK ASSET STATE
 */
let assetResults = [];
let selectedAssetIndex = 0;


imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files);

  if (files.length === 0) {
    return;
  }

  assetResults = files.map((file) => ({
    file,
    metadata: null,
    confidenceEvaluation: null,
    status: "ready",
    approved: false,
    aemResult: null,
  }));

  selectedAssetIndex = 0;
  analyzeButton.disabled = false;
  analyzeButton.textContent = "✨ Analyze with AI";

  const firstFile = files[0];
  preview.src = URL.createObjectURL(firstFile);
  preview.style.display = "block";

  if (files.length === 1) {
    fileName.textContent = firstFile.name;
  } else {
    fileName.textContent = `${files.length} assets selected`;
  }

  renderAssetQueueFromResults();
  clearMetadata();
  metadataSection.style.display = "none";
  emptyState.style.display = "block";
  resetAemSync();
  resetConfidenceWarning();
  clearStatus();
});


/*
 * ANALYZE ASSETS
 */
analyzeButton.addEventListener("click", async () => {
  if (assetResults.length === 0) {
    showStatus("Please select at least one image first.", "error");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "⏳ Analyzing assets...";

  resetConfidenceWarning();
  resetAemSync();

  try {
    for (let index = 0; index < assetResults.length; index++) {
      const asset = assetResults[index];
      asset.status = "analyzing";
      renderAssetQueueFromResults();

      showStatus(
        `Analyzing ${index + 1} of ${assetResults.length}: ${asset.file.name}`,
        "info"
      );

      const formData = new FormData();
      formData.append("image", asset.file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        asset.status = "failed";
        renderAssetQueueFromResults();
        throw new Error(
          `${asset.file.name}: ${
            data.details || data.error || "Analysis failed"
          }`
        );
      }

      asset.metadata = data.metadata;
      asset.confidenceEvaluation = data.confidenceEvaluation;
      asset.status = "processed";
      renderAssetQueueFromResults();
    }

    assetResults.forEach((asset) => {
      if (asset.status === "processed") {
        asset.status = "analyzed";
      }
    });

    renderAssetQueueFromResults();
    selectedAssetIndex = -1;
    metadataSection.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML = `
      <strong>✓ Analysis Complete</strong>
      <p>
        ${assetResults.length} ${
          assetResults.length === 1 ? "asset has" : "assets have"
        } been analyzed.
      </p>
      <p>
        Click an asset under
        <strong>Selected Assets</strong>
        to review its AI-generated metadata.
      </p>
    `;

    resetConfidenceWarning();
    resetAemSync();

    showStatus(
      "✓ Analysis complete. Click an asset to review its metadata.",
      "success"
    );
  } catch (error) {
    showStatus("Analysis failed: " + error.message, "error");
  } finally {
    const allAnalyzed =
      assetResults.length > 0 &&
      assetResults.every(
        (asset) =>
          asset.status === "analyzed" || asset.status === "approved"
      );

    if (allAnalyzed) {
      analyzeButton.disabled = true;
      analyzeButton.textContent = "✓ Analysis Complete";
    } else {
      analyzeButton.disabled = false;
      analyzeButton.textContent = "✨ Analyze with AI";
    }
  }
});


/*
 * APPROVE SELECTED ASSET
 */
approveButton.addEventListener("click", async () => {
  const asset = assetResults[selectedAssetIndex];

  if (!asset || !asset.metadata) {
    showStatus("Please analyze the asset before approval.", "error");
    return;
  }

  const approvedMetadata = getMetadataFromForm();
  asset.metadata = {
    ...asset.metadata,
    title: approvedMetadata.title,
    description: approvedMetadata.description,
    altText: approvedMetadata.altText,
    tags: approvedMetadata.tags,
    classification: approvedMetadata.classification,
  };

  approveButton.disabled = true;
  approveButton.textContent = "Approving...";

  try {
    const response = await fetch("/api/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(approvedMetadata),
    });

    const data = await response.json();

    if (!response.ok) {
      const validationErrors = Array.isArray(data.errors)
        ? data.errors.join(" ")
        : "";
      throw new Error(
        validationErrors ||
          data.message ||
          data.error ||
          "Approval failed"
      );
    }

    asset.status = "approved";
    asset.approved = true;
    renderAssetQueueFromResults();

    showStatus(
      `✓ ${asset.file.name} approved successfully.`,
      "success"
    );
    approveButton.textContent = "✓ Approved";

    if (data.aemResult?.success) {
      asset.aemResult = data.aemResult;
      aemSyncResult.style.display = "block";
      aemSyncStatus.textContent =
        data.aemResult.mode === "mock"
          ? "Simulated successfully (Mock Mode)"
          : "Synced successfully";
      aemAssetPath.textContent = data.aemResult.assetPath || "--";
    }
  } catch (error) {
    showStatus("Approval failed: " + error.message, "error");
    approveButton.textContent = "✓ Approve Metadata";
  } finally {
    const currentAsset = assetResults[selectedAssetIndex];

    if (currentAsset?.approved || currentAsset?.status === "approved") {
      approveButton.disabled = true;
      approveButton.textContent = "✓ Approved";
    } else {
      approveButton.disabled = false;
      approveButton.textContent = "✓ Approve Metadata";
    }
  }
});


/*
 * RESET
 */
resetButton.addEventListener("click", () => {
  imageInput.value = "";
  assetResults = [];
  selectedAssetIndex = -1;

  analyzeButton.disabled = false;
  analyzeButton.textContent = "✨ Analyze with AI";

  renderAssetQueueFromResults();
  preview.src = "";
  preview.style.display = "none";
  fileName.textContent = "Select an image to begin";

  clearMetadata();
  metadataSection.style.display = "none";
  emptyState.style.display = "block";

  approveButton.textContent = "✓ Approve Metadata";
  resetAemSync();
  resetConfidenceWarning();
  clearStatus();
});

/*
 * UPDATE BATCH SUMMARY
 */
function updateBatchSummary() {
  const total = assetResults.length;
  const analyzed = assetResults.filter(
    (asset) => asset.status === "analyzed" || asset.status === "approved"
  ).length;
  const approved = assetResults.filter(
    (asset) => asset.status === "approved"
  ).length;
  const toReview = assetResults.filter(
    (asset) => asset.status === "analyzed"
  ).length;

  summaryTotal.textContent = total;
  summaryAnalyzed.textContent = analyzed;
  summaryApproved.textContent = approved;
  summaryReview.textContent = toReview;
}

/*
 * RENDER BULK ASSET QUEUE
 */

function renderAssetQueueFromResults() {

  updateBatchSummary();

  assetQueueList.innerHTML =
    "";

  if (assetResults.length === 0) {

    assetQueue.style.display =
      "none";

    assetCount.textContent =
      "0 assets";

    return;
  }

  assetQueue.style.display =
    "block";

  assetCount.textContent =
    assetResults.length === 1
      ? "1 asset"
      : `${assetResults.length} assets`;

  assetResults.forEach(
    (asset, index) => {

      const item =
        document.createElement("div");

      item.className =
        "asset-queue-item";

      if (index === selectedAssetIndex) {

        item.classList.add(
          "asset-queue-item-selected"
        );
      }

      const thumbnail =
        document.createElement("img");

      thumbnail.src =
        URL.createObjectURL(
          asset.file
        );

      thumbnail.alt =
        asset.file.name;

      const info =
        document.createElement("div");

      info.className =
        "asset-queue-info";

      const name =
        document.createElement("span");

      name.className =
        "asset-queue-name";

      name.textContent =
        asset.file.name;

      const queueStatus =
        document.createElement("span");

      queueStatus.className =
        "asset-queue-status";

      switch (asset.status) {

  case "analyzing":

    queueStatus.textContent =
      "Analyzing...";

    break;


  case "processed":

    queueStatus.textContent =
      "Processing batch...";

    break;

    case "analyzed":

    queueStatus.textContent =
      "● Awaiting Review";

    break;


  case "approved":

    queueStatus.textContent =
      "✓ Approved";

    break;


  case "failed":

    queueStatus.textContent =
      "✕ Analysis failed";

    break;


  default:

    queueStatus.textContent =
      "Ready";
}


      info.appendChild(name);
      info.appendChild(queueStatus);

      item.appendChild(thumbnail);
      item.appendChild(info);

      /*
 * REMOVE ASSET BUTTON
 */

const removeButton =
  document.createElement("button");

removeButton.type =
  "button";

removeButton.className =
  "asset-remove-button";

removeButton.textContent =
  "×";

const analysisRunning =
  assetResults.some(
    asset =>
      asset.status === "analyzing" ||
      asset.status === "processed"
  );

removeButton.disabled =
  analysisRunning;

removeButton.title =
  analysisRunning
    ? "Cannot remove assets while analysis is running"
    : `Remove ${asset.file.name}`;

removeButton.setAttribute(
  "aria-label",
  `Remove ${asset.file.name}`
);

removeButton.addEventListener(
  "click",
  (event) => {

    /*
     * Prevent queue-item click from firing.
     */

    event.stopPropagation();

    removeAsset(index);
  }
);

item.appendChild(removeButton);

      /*
       * SELECT ASSET
       */

      item.addEventListener(
        "click",
        () => {

          saveCurrentAssetEdits();

          selectedAssetIndex =
            index;

          displaySelectedAsset();

          renderAssetQueueFromResults();
        }
      );

      assetQueueList.appendChild(
        item
      );
    }
  );
}

/*
 * REMOVE ASSET FROM QUEUE
 */
function removeAsset(index) {
  if (index < 0 || index >= assetResults.length) {
    return;
  }

  const removedAsset = assetResults[index];
  assetResults.splice(index, 1);

  if (assetResults.length === 0) {
    selectedAssetIndex = -1;
    preview.src = "";
    preview.style.display = "none";
    fileName.textContent = "Select an image to begin";
    clearMetadata();
    metadataSection.style.display = "none";
    emptyState.style.display = "block";
    analyzeButton.disabled = true;
    analyzeButton.textContent = "✨ Analyze with AI";
    approveButton.disabled = true;
    approveButton.textContent = "✓ Approve Metadata";
    resetAemSync();
    resetConfidenceWarning();
    renderAssetQueueFromResults();

    showStatus(
      `${removedAsset.file.name} removed.`,
      "info"
    );
    return;
  }

  if (selectedAssetIndex === index) {
    selectedAssetIndex = Math.min(index, assetResults.length - 1);
  } else if (selectedAssetIndex > index) {
    selectedAssetIndex--;
  }

  const hasReadyAssets = assetResults.some(
    (asset) => asset.status === "ready" || asset.status === "failed"
  );

  analyzeButton.disabled = !hasReadyAssets;
  analyzeButton.textContent = hasReadyAssets
    ? "✨ Analyze with AI"
    : "✓ Analysis Complete";

  renderAssetQueueFromResults();
  displaySelectedAsset();

  showStatus(
    `${removedAsset.file.name} removed. ${assetResults.length} ${
      assetResults.length === 1 ? "asset remains." : "assets remain."
    }`,
    "info"
  );
}

function displaySelectedAsset() {
  const asset = assetResults[selectedAssetIndex];

  if (!asset) {
    return;
  }

  preview.src = URL.createObjectURL(asset.file);
  preview.style.display = "block";
  fileName.textContent = asset.file.name;

  if (!asset.metadata) {
    clearMetadata();
    metadataSection.style.display = "none";
    emptyState.style.display = "block";
    resetConfidenceWarning();
    resetAemSync();
    approveButton.disabled = true;
    approveButton.textContent = "✓ Approve Metadata";
    return;
  }

  populateMetadata(asset.metadata);
  updateConfidenceWarning(asset.confidenceEvaluation);
  emptyState.style.display = "none";
  metadataSection.style.display = "block";

  const isApproved =
    asset.approved === true || asset.status === "approved";

  if (isApproved) {
    approveButton.disabled = true;
    approveButton.textContent = "✓ Approved";
  } else {
    approveButton.disabled = false;
    approveButton.textContent = "✓ Approve Metadata";
  }

  if (isApproved && asset.aemResult?.success) {
    aemSyncResult.style.display = "block";
    aemSyncStatus.textContent =
      asset.aemResult.mode === "mock"
        ? "Simulated successfully (Mock Mode)"
        : "Synced successfully";
    aemAssetPath.textContent = asset.aemResult.assetPath || "--";
  } else {
    resetAemSync();
  }
}


/*
 * SAVE CURRENT HUMAN EDITS
 */
function saveCurrentAssetEdits() {
  const asset = assetResults[selectedAssetIndex];

  if (
    !asset ||
    !asset.metadata ||
    metadataSection.style.display === "none"
  ) {
    return;
  }

  const formMetadata = getMetadataFromForm();
  asset.metadata = {
    ...asset.metadata,
    title: formMetadata.title,
    description: formMetadata.description,
    altText: formMetadata.altText,
    tags: formMetadata.tags,
    classification: formMetadata.classification,
  };
}


/*
 * POPULATE AI METADATA
 */
function populateMetadata(metadata) {
  document.getElementById("title").value = metadata.title || "";
  document.getElementById("description").value = metadata.description || "";
  document.getElementById("altText").value = metadata.altText || "";
  document.getElementById("tags").value = Array.isArray(metadata.tags)
    ? metadata.tags.join(", ")
    : metadata.tags || "";
  document.getElementById("classification").value =
    metadata.classification || "";

  const confidence = Number(metadata.confidence);
  document.getElementById("confidence").textContent = Number.isFinite(
    confidence
  )
    ? Math.round(confidence * 100) + "%"
    : "--";
}


/*
 * GET HUMAN-REVIEWED METADATA
 */
function getMetadataFromForm() {
  const asset = assetResults[selectedAssetIndex];

  return {
    fileName: asset?.file?.name || "",
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    altText: document.getElementById("altText").value.trim(),
    tags: document
      .getElementById("tags")
      .value.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    classification: document
      .getElementById("classification")
      .value.trim(),
    confidence: document.getElementById("confidence").textContent,
  };
}


/*
 * CLEAR METADATA
 */
function clearMetadata() {
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("altText").value = "";
  document.getElementById("tags").value = "";
  document.getElementById("classification").value = "";
  document.getElementById("confidence").textContent = "--";
}


/*
 * UPDATE CONFIDENCE WARNING
 */
function updateConfidenceWarning(evaluation) {
  if (!confidenceWarning || !confidenceWarningText) {
    return;
  }

  if (!evaluation) {
    resetConfidenceWarning();
    return;
  }

  if (evaluation.lowConfidence) {
    const score = Math.round(evaluation.score * 100);
    const threshold = Math.round(evaluation.threshold * 100);

    confidenceWarning.style.display = "block";
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

  confidenceWarning.style.display = "none";

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

  aemSyncResult.style.display = "none";

  if (aemSyncStatus) {
    aemSyncStatus.textContent = "Waiting for approval";
  }

  if (aemAssetPath) {
    aemAssetPath.textContent = "--";
  }
}


/*
 * STATUS MESSAGE
 */
function showStatus(message, type) {
  status.textContent = message;
  status.className = "status-" + type;
}


/*
 * CLEAR STATUS
 */
function clearStatus() {
  status.textContent = "";
  status.className = "";
}