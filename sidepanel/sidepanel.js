import { AudioService } from "../services/audioService.js";
import { mockGenerateSoapNoteFromAudio } from "../services/mockAiService.js";

/**
 * sidepanel/sidepanel.js
 * UI logic + ephemeral state management.
 */

/** @typedef {"IDLE"|"RECORDING"|"PROCESSING"|"DONE"|"ERROR"} UiState */

const audioService = new AudioService();

/** @type {UiState} */
let uiState = "IDLE";

/** @type {Blob|null} */
let audioBlob = null;

/** @type {string} */
let transcript = "";

/** @type {string} */
let soapNoteText = "";

/** @type {string|null} */
let lastErrorMessage = null;

const els = {
  statusDot: /** @type {HTMLElement} */ (document.getElementById("statusDot")),
  statusText: /** @type {HTMLElement} */ (document.getElementById("statusText")),
  recordBtn: /** @type {HTMLButtonElement} */ (document.getElementById("recordBtn")),
  copyBtn: /** @type {HTMLButtonElement} */ (document.getElementById("copyBtn")),
  clearBtn: /** @type {HTMLButtonElement} */ (document.getElementById("clearBtn")),
  noteTextarea: /** @type {HTMLTextAreaElement} */ (document.getElementById("noteTextarea")),
  hintText: /** @type {HTMLElement} */ (document.getElementById("hintText")),
  alertBox: /** @type {HTMLElement} */ (document.getElementById("alertBox")),
  alertText: /** @type {HTMLElement} */ (document.getElementById("alertText")),
  transcriptPre: /** @type {HTMLElement} */ (document.getElementById("transcriptPre")),
  transcriptDetails: /** @type {HTMLDetailsElement} */ (document.getElementById("transcriptDetails"))
};

function setAlert(message) {
  lastErrorMessage = message;
  if (!message) {
    els.alertBox.hidden = true;
    els.alertText.textContent = "";
    return;
  }
  els.alertText.textContent = message;
  els.alertBox.hidden = false;
}

/**
 * @param {UiState} state
 */
function setUiState(state) {
  uiState = state;
  render();
}

/**
 * Clears all in-memory PHI-ish data and stops recording if needed.
 */
function clearAllEphemeralData() {
  audioService.cancelAndClear();
  audioBlob = null;
  transcript = "";
  soapNoteText = "";
  lastErrorMessage = null;

  els.noteTextarea.value = "";
  els.transcriptPre.textContent = "";
  els.transcriptDetails.open = false;

  setAlert("");
  setUiState("IDLE");
}

function render() {
  const stateLabel = uiState[0] + uiState.slice(1).toLowerCase(); // Idle/Recording/...

  els.statusText.textContent = stateLabel;

  // Status dot color
  let dotColor = "var(--muted)";
  let dotGlow = "rgba(184, 195, 230, 0.15)";

  if (uiState === "RECORDING") {
    dotColor = "var(--danger)";
    dotGlow = "rgba(255, 91, 110, 0.22)";
  } else if (uiState === "PROCESSING") {
    dotColor = "var(--warn)";
    dotGlow = "rgba(255, 204, 102, 0.22)";
  } else if (uiState === "DONE") {
    dotColor = "var(--ok)";
    dotGlow = "rgba(53, 208, 127, 0.20)";
  } else if (uiState === "ERROR") {
    dotColor = "var(--danger)";
    dotGlow = "rgba(255, 91, 110, 0.22)";
  }

  els.statusDot.style.background = dotColor;
  els.statusDot.style.boxShadow = `0 0 0 3px ${dotGlow}`;

  // Buttons and text
  const isRecording = uiState === "RECORDING";
  const isProcessing = uiState === "PROCESSING";

  els.recordBtn.disabled = isProcessing;
  els.clearBtn.disabled = false;

  if (isRecording) {
    els.recordBtn.textContent = "Stop";
  } else if (isProcessing) {
    els.recordBtn.textContent = "Processing…";
  } else {
    els.recordBtn.textContent = "Start Recording";
  }

  const hasNote = (els.noteTextarea.value || "").trim().length > 0;
  els.copyBtn.disabled = !hasNote || isRecording || isProcessing;

  // Hint text
  if (uiState === "IDLE") {
    els.hintText.textContent = "Tip: Record the encounter, then stop to generate a SOAP note.";
  } else if (uiState === "RECORDING") {
    els.hintText.textContent = "Recording… Stop when finished. Audio is kept only in memory.";
  } else if (uiState === "PROCESSING") {
    els.hintText.textContent = "Generating note (mock AI)… please wait.";
  } else if (uiState === "DONE") {
    els.hintText.textContent = "Review/edit the note, then copy to clipboard for EHR entry.";
  } else if (uiState === "ERROR") {
    els.hintText.textContent = "Resolve the issue and try again, or hit Clear.";
  }
}

/**
 * Starts microphone recording.
 */
async function handleStartRecording() {
  setAlert("");

  try {
    await audioService.startRecording();
    setUiState("RECORDING");
  } catch (error) {
    setAlert(error instanceof Error ? error.message : "Unable to start recording.");
    setUiState("ERROR");
  }
}

/**
 * Stops recording and runs mock STT+LLM generation.
 */
async function handleStopAndProcess() {
  setAlert("");
  setUiState("PROCESSING");

  try {
    const recording = await audioService.stopRecording();
    audioBlob = recording.audioBlob;

    const result = await mockGenerateSoapNoteFromAudio(audioBlob, {
      durationMs: recording.durationMs
    });

    transcript = result.transcript;
    soapNoteText = result.soapNoteText;

    // Render output (still ephemeral; editable)
    els.noteTextarea.value = soapNoteText;
    els.transcriptPre.textContent = transcript;

    setUiState("DONE");
  } catch (error) {
    setAlert(error instanceof Error ? error.message : "Processing failed.");
    setUiState("ERROR");
  } finally {
    // Ensure we do not keep large blobs longer than needed.
    // In MVP we keep the final note/transcript text for editing until Clear/panel close.
    audioBlob = null;
  }
}

/**
 * Copies SOAP note text to clipboard.
 */
async function handleCopyToClipboard() {
  setAlert("");

  const text = (els.noteTextarea.value || "").trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    setAlert(
      "Clipboard copy failed. Your browser may require a user gesture or additional permissions."
    );
    setUiState("ERROR");
    return;
  }
}

/**
 * Toggle record button behavior based on state.
 */
async function handleRecordButtonClick() {
  if (uiState === "RECORDING") {
    await handleStopAndProcess();
    return;
  }
  if (uiState === "PROCESSING") return;

  // From IDLE/DONE/ERROR -> start new recording (does not auto-clear note; user can Clear explicitly).
  await handleStartRecording();
}

function bindEvents() {
  els.recordBtn.addEventListener("click", handleRecordButtonClick);
  els.copyBtn.addEventListener("click", handleCopyToClipboard);
  els.clearBtn.addEventListener("click", clearAllEphemeralData);

  // If user edits note, re-enable copy button.
  els.noteTextarea.addEventListener("input", () => render());

  // Best-effort ephemeral cleanup when the panel is closed/unloaded.
  window.addEventListener("beforeunload", () => {
    clearAllEphemeralData();
  });

  document.addEventListener("visibilitychange", () => {
    // Not clearing on hidden by default (can be disruptive),
    // but do stop recording if the panel becomes hidden.
    if (document.visibilityState === "hidden" && uiState === "RECORDING") {
      audioService.cancelAndClear();
      setAlert("Recording stopped because the panel was hidden.");
      setUiState("ERROR");
    }
  });
}

bindEvents();
render();