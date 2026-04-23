import { AudioService } from "../services/audioService.js";
import {
  DEFAULT_SYSTEM_PROMPT,
  PROVIDERS,
  getProviderSummary,
  isProviderConfigured,
  loadAiSettings,
  normalizeAiSettings,
  saveAiSettings
} from "../services/aiConfigService.js";
import { generateSoapNoteFromTranscript } from "../services/aiProviderService.js";
import {
  createEncounterDraft,
  loadEncounterState,
  saveEncounterState
} from "../services/encounterStorageService.js";
import { mockTranscribeAudio } from "../services/mockAiService.js";

/**
 * sidepanel/sidepanel.js
 * UI logic, provider settings, and ephemeral note generation workflow.
 */

/** @typedef {"IDLE"|"RECORDING"|"PROCESSING"|"DONE"|"ERROR"} UiState */

const audioService = new AudioService();
const THEME_STORAGE_KEY = "joyscribe-theme";
const ENCOUNTER_AUTOSAVE_DELAY_MS = 180;
const STATUS_ICON_PATHS = {
  settings:
    "M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.14 11.06L21.03 9.59C21.2 9.46 21.25 9.22 21.15 9.03L19.35 5.92C19.25 5.73 19.03 5.65 18.83 5.71L16.6 6.61C16.12 6.24 15.6 5.93 15.03 5.69L14.7 3.31C14.67 3.1 14.49 2.95 14.28 2.95H10.68C10.47 2.95 10.29 3.1 10.26 3.31L9.93 5.69C9.36 5.93 8.84 6.24 8.36 6.61L6.13 5.71C5.93 5.65 5.71 5.73 5.61 5.92L3.81 9.03C3.71 9.22 3.76 9.46 3.93 9.59L5.82 11.06C5.78 11.36 5.76 11.68 5.76 12C5.76 12.32 5.78 12.64 5.82 12.94L3.93 14.41C3.76 14.54 3.71 14.78 3.81 14.97L5.61 18.08C5.71 18.27 5.93 18.35 6.13 18.29L8.36 17.39C8.84 17.76 9.36 18.07 9.93 18.31L10.26 20.69C10.29 20.9 10.47 21.05 10.68 21.05H14.28C14.49 21.05 14.67 20.9 14.7 20.69L15.03 18.31C15.6 18.07 16.12 17.76 16.6 17.39L18.83 18.29C19.03 18.35 19.25 18.27 19.35 18.08L21.15 14.97C21.25 14.78 21.2 14.54 21.03 14.41L19.14 12.94ZM12.48 15.6C10.49 15.6 8.88 13.99 8.88 12C8.88 10.01 10.49 8.4 12.48 8.4C14.47 8.4 16.08 10.01 16.08 12C16.08 13.99 14.47 15.6 12.48 15.6Z",
  login:
    "M11 7L9.59 8.41 13.17 12H3V14H13.17L9.59 17.58 11 19 17 13 11 7ZM19 3H11V5H19V19H11V21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z",
  mic: "M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.3 11C17.3 14 14.76 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.23 19 14.41 19 11H17.3Z"
};

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

/** @type {"light"|"dark"} */
let themeMode = "dark";

let settingsLoaded = false;
let isSettingsOpen = false;
let lastFocusedElement = null;
let aiSettings = normalizeAiSettings();
let encounterState = {
  activeEncounterId: "",
  encounters: []
};
let encounterPersistTimer = null;

const els = {
  statusButton: /** @type {HTMLButtonElement} */ (document.getElementById("statusButton")),
  statusButtonIconPath: /** @type {SVGPathElement} */ (
    document.getElementById("statusButtonIconPath")
  ),
  recordBtn: /** @type {HTMLButtonElement} */ (document.getElementById("recordBtn")),
  copyBtn: /** @type {HTMLButtonElement} */ (document.getElementById("copyBtn")),
  clearBtn: /** @type {HTMLButtonElement} */ (document.getElementById("clearBtn")),
  newEncounterBtn: /** @type {HTMLButtonElement} */ (document.getElementById("newEncounterBtn")),
  closeEncounterBtn: /** @type {HTMLButtonElement} */ (
    document.getElementById("closeEncounterBtn")
  ),
  encounterSelect: /** @type {HTMLSelectElement} */ (document.getElementById("encounterSelect")),
  encounterLabelInput: /** @type {HTMLInputElement} */ (
    document.getElementById("encounterLabelInput")
  ),
  encounterContextInput: /** @type {HTMLTextAreaElement} */ (
    document.getElementById("encounterContextInput")
  ),
  encounterMeta: /** @type {HTMLElement} */ (document.getElementById("encounterMeta")),
  noteTextarea: /** @type {HTMLTextAreaElement} */ (document.getElementById("noteTextarea")),
  hintText: /** @type {HTMLElement} */ (document.getElementById("hintText")),
  providerSummary: /** @type {HTMLElement} */ (document.getElementById("providerSummary")),
  alertBox: /** @type {HTMLElement} */ (document.getElementById("alertBox")),
  alertText: /** @type {HTMLElement} */ (document.getElementById("alertText")),
  transcriptPre: /** @type {HTMLElement} */ (document.getElementById("transcriptPre")),
  transcriptDetails: /** @type {HTMLDetailsElement} */ (document.getElementById("transcriptDetails")),
  settingsBtn: /** @type {HTMLButtonElement} */ (document.getElementById("settingsBtn")),
  themeToggleBtn: /** @type {HTMLButtonElement} */ (document.getElementById("themeToggleBtn")),
  themeToggleIcon: /** @type {HTMLElement} */ (document.getElementById("themeToggleIcon")),
  settingsOverlay: /** @type {HTMLElement} */ (document.getElementById("settingsOverlay")),
  settingsForm: /** @type {HTMLFormElement} */ (document.getElementById("settingsForm")),
  settingsCloseBtn: /** @type {HTMLButtonElement} */ (document.getElementById("settingsCloseBtn")),
  cancelSettingsBtn: /** @type {HTMLButtonElement} */ (document.getElementById("cancelSettingsBtn")),
  resetPromptBtn: /** @type {HTMLButtonElement} */ (document.getElementById("resetPromptBtn")),
  providerSelect: /** @type {HTMLSelectElement} */ (document.getElementById("providerSelect")),
  openaiApiKeyInput: /** @type {HTMLInputElement} */ (document.getElementById("openaiApiKeyInput")),
  openaiModelInput: /** @type {HTMLInputElement} */ (document.getElementById("openaiModelInput")),
  openaiBaseUrlInput: /** @type {HTMLInputElement} */ (document.getElementById("openaiBaseUrlInput")),
  geminiApiKeyInput: /** @type {HTMLInputElement} */ (document.getElementById("geminiApiKeyInput")),
  geminiModelInput: /** @type {HTMLInputElement} */ (document.getElementById("geminiModelInput")),
  azureApiKeyInput: /** @type {HTMLInputElement} */ (document.getElementById("azureApiKeyInput")),
  azureEndpointInput: /** @type {HTMLInputElement} */ (document.getElementById("azureEndpointInput")),
  azureModelInput: /** @type {HTMLInputElement} */ (document.getElementById("azureModelInput")),
  ollamaEndpointInput: /** @type {HTMLInputElement} */ (document.getElementById("ollamaEndpointInput")),
  ollamaModelInput: /** @type {HTMLInputElement} */ (document.getElementById("ollamaModelInput")),
  systemPromptInput: /** @type {HTMLTextAreaElement} */ (document.getElementById("systemPromptInput"))
};

const providerFieldSections = Array.from(document.querySelectorAll("[data-provider-config]"));

function getActiveEncounter() {
  return (
    encounterState.encounters.find((encounter) => encounter.id === encounterState.activeEncounterId) ||
    null
  );
}

function getEncounterDisplayLabel(encounter, index) {
  const trimmedLabel = encounter.label.trim();
  return trimmedLabel || `Encounter ${index + 1}`;
}

function renderEncounterOptions() {
  const activeEncounter = getActiveEncounter();
  const nextActiveId = activeEncounter?.id || encounterState.encounters[0]?.id || "";

  while (els.encounterSelect.firstChild) {
    els.encounterSelect.removeChild(els.encounterSelect.firstChild);
  }

  for (const [index, encounter] of encounterState.encounters.entries()) {
    const option = document.createElement("option");
    option.value = encounter.id;
    option.textContent = getEncounterDisplayLabel(encounter, index);
    option.selected = encounter.id === nextActiveId;
    els.encounterSelect.appendChild(option);
  }
}

function updateEncounterMeta() {
  const activeEncounter = getActiveEncounter();
  const openCount = encounterState.encounters.length;
  const savedParts = [];

  if (activeEncounter?.context.trim()) savedParts.push("context");
  if (activeEncounter?.noteText.trim()) savedParts.push("note");
  if (activeEncounter?.transcript.trim()) savedParts.push("transcript");

  const draftSummary = savedParts.length > 0
    ? `Saved locally: ${savedParts.join(", ")}.`
    : "No local draft content yet.";

  els.encounterMeta.textContent =
    `${openCount} open encounter${openCount === 1 ? "" : "s"}. ${draftSummary}`;
}

function buildActiveEncounterDraft(overrides = {}) {
  const activeEncounter = getActiveEncounter() || createEncounterDraft();
  const nowIso = new Date().toISOString();

  return {
    ...activeEncounter,
    label: els.encounterLabelInput.value.trim(),
    context: els.encounterContextInput.value,
    noteText: els.noteTextarea.value,
    transcript,
    updatedAt: nowIso,
    ...overrides
  };
}

function replaceEncounterDraft(encounterDraft) {
  return encounterState.encounters.map((encounter) =>
    encounter.id === encounterDraft.id ? encounterDraft : encounter
  );
}

function syncActiveEncounterDraftInMemory(overrides = {}) {
  const activeEncounter = getActiveEncounter();
  if (!activeEncounter) return null;

  const nextEncounter = buildActiveEncounterDraft({
    id: activeEncounter.id,
    createdAt: activeEncounter.createdAt,
    ...overrides
  });

  encounterState = {
    ...encounterState,
    activeEncounterId: nextEncounter.id,
    encounters: replaceEncounterDraft(nextEncounter)
  };

  return nextEncounter;
}

async function persistEncounterState(nextState) {
  try {
    encounterState = await saveEncounterState(nextState);
    renderEncounterOptions();
    updateEncounterMeta();
    render();
  } catch (error) {
    setAlert(error instanceof Error ? error.message : "Failed to save encounter draft locally.");
    setUiState("ERROR");
  }
}

async function persistActiveEncounterDraft() {
  const nextEncounter = syncActiveEncounterDraftInMemory();
  if (!nextEncounter) return;

  await persistEncounterState({
    ...encounterState,
    activeEncounterId: nextEncounter.id,
    encounters: replaceEncounterDraft(nextEncounter)
  });
}

function cancelScheduledEncounterPersist() {
  if (encounterPersistTimer != null) {
    window.clearTimeout(encounterPersistTimer);
    encounterPersistTimer = null;
  }
}

function scheduleActiveEncounterPersist() {
  cancelScheduledEncounterPersist();
  encounterPersistTimer = window.setTimeout(() => {
    encounterPersistTimer = null;
    void persistActiveEncounterDraft();
  }, ENCOUNTER_AUTOSAVE_DELAY_MS);
}

async function flushActiveEncounterPersist() {
  cancelScheduledEncounterPersist();
  await persistActiveEncounterDraft();
}

function applyEncounterToUi(encounter) {
  const safeEncounter = encounter || createEncounterDraft();

  audioBlob = null;
  transcript = safeEncounter.transcript || "";
  soapNoteText = safeEncounter.noteText || "";
  lastErrorMessage = null;

  els.encounterLabelInput.value = safeEncounter.label || "";
  els.encounterContextInput.value = safeEncounter.context || "";
  els.noteTextarea.value = soapNoteText;
  els.transcriptPre.textContent = transcript;
  els.transcriptDetails.open = Boolean(transcript);

  setAlert("");
  setUiState(transcript || soapNoteText ? "DONE" : "IDLE");
}

/**
 * @returns {"light"|"dark"}
 */
function getInitialThemeMode() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {}

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyThemeMode() {
  document.documentElement.dataset.theme = themeMode;
  const nextThemeLabel = themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode";
  els.themeToggleIcon.textContent = themeMode === "dark" ? "☀" : "☾";
  els.themeToggleBtn.setAttribute("aria-pressed", String(themeMode === "dark"));
  els.themeToggleBtn.setAttribute("aria-label", nextThemeLabel);
  els.themeToggleBtn.title = nextThemeLabel;
}

function toggleThemeMode() {
  themeMode = themeMode === "dark" ? "light" : "dark";
  applyThemeMode();

  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch {}
}

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

function isNetworkBlocked() {
  return aiSettings.provider !== PROVIDERS.ollama && !navigator.onLine;
}

function populateSettingsForm(settings) {
  const normalized = normalizeAiSettings(settings);

  els.providerSelect.value = normalized.provider;
  els.openaiApiKeyInput.value = normalized.openai.apiKey;
  els.openaiModelInput.value = normalized.openai.model;
  els.openaiBaseUrlInput.value = normalized.openai.baseUrl;
  els.geminiApiKeyInput.value = normalized.gemini.apiKey;
  els.geminiModelInput.value = normalized.gemini.model;
  els.azureApiKeyInput.value = normalized.azure.apiKey;
  els.azureEndpointInput.value = normalized.azure.endpoint;
  els.azureModelInput.value = normalized.azure.model;
  els.ollamaEndpointInput.value = normalized.ollama.endpoint;
  els.ollamaModelInput.value = normalized.ollama.model;
  els.systemPromptInput.value = normalized.systemPrompt;

  syncProviderFieldVisibility();
}

function readSettingsFromForm() {
  return normalizeAiSettings({
    provider: els.providerSelect.value,
    systemPrompt: els.systemPromptInput.value,
    openai: {
      apiKey: els.openaiApiKeyInput.value,
      model: els.openaiModelInput.value,
      baseUrl: els.openaiBaseUrlInput.value
    },
    gemini: {
      apiKey: els.geminiApiKeyInput.value,
      model: els.geminiModelInput.value
    },
    azure: {
      apiKey: els.azureApiKeyInput.value,
      endpoint: els.azureEndpointInput.value,
      model: els.azureModelInput.value
    },
    ollama: {
      endpoint: els.ollamaEndpointInput.value,
      model: els.ollamaModelInput.value
    }
  });
}

function syncProviderFieldVisibility() {
  const provider = els.providerSelect.value;

  for (const section of providerFieldSections) {
    section.hidden = section.dataset.providerConfig !== provider;
  }
}

function openSettings() {
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  isSettingsOpen = true;
  populateSettingsForm(aiSettings);
  els.settingsOverlay.hidden = false;
  els.providerSelect.focus();
}

function closeSettings() {
  isSettingsOpen = false;
  els.settingsOverlay.hidden = true;

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

/**
 * Clears all in-memory PHI-ish data and stops recording if needed.
 */
async function clearAllEphemeralData() {
  audioService.cancelAndClear();
  audioBlob = null;
  transcript = "";
  soapNoteText = "";
  lastErrorMessage = null;

  els.encounterContextInput.value = "";
  els.noteTextarea.value = "";
  els.transcriptPre.textContent = "";
  els.transcriptDetails.open = false;

  syncActiveEncounterDraftInMemory();
  setAlert("");
  setUiState("IDLE");
  await flushActiveEncounterPersist();
}

function render() {
  const providerReady = settingsLoaded && isProviderConfigured(aiSettings);
  const networkBlocked = settingsLoaded && isNetworkBlocked();
  const isRecording = uiState === "RECORDING";
  const isProcessing = uiState === "PROCESSING";
  const activeEncounter = getActiveEncounter();
  const encounterLocked = isRecording || isProcessing;

  renderEncounterOptions();
  updateEncounterMeta();

  els.clearBtn.disabled = isProcessing;
  els.encounterSelect.disabled = encounterLocked || !activeEncounter;
  els.newEncounterBtn.disabled = encounterLocked;
  els.closeEncounterBtn.disabled = encounterLocked || !activeEncounter;
  els.encounterLabelInput.disabled = encounterLocked || !activeEncounter;
  els.encounterContextInput.disabled = encounterLocked || !activeEncounter;

  let statusButtonState = "ready";
  let statusButtonLabel = "JoyScribe is ready to record.";
  let statusButtonIconPath = STATUS_ICON_PATHS.mic;

  if (!settingsLoaded) {
    statusButtonState = "offline";
    statusButtonLabel = "Loading JoyScribe settings.";
    statusButtonIconPath = STATUS_ICON_PATHS.settings;
  } else if (!providerReady) {
    statusButtonState = "offline";
    statusButtonLabel = "Configure an AI provider and system instructions to continue.";
    statusButtonIconPath = STATUS_ICON_PATHS.settings;
  } else if (networkBlocked) {
    statusButtonState = "offline";
    statusButtonLabel = "JoyScribe is offline. Cloud providers require network access.";
    statusButtonIconPath = STATUS_ICON_PATHS.login;
  } else if (isRecording) {
    statusButtonState = "listening";
    statusButtonLabel = "JoyScribe is listening for audio. Click to stop recording.";
  } else if (isProcessing) {
    statusButtonLabel = "JoyScribe is processing audio.";
  }

  els.statusButton.dataset.state = statusButtonState;
  els.statusButton.disabled = isProcessing || !settingsLoaded;
  els.statusButton.setAttribute("aria-label", statusButtonLabel);
  els.statusButton.title = statusButtonLabel;
  els.statusButtonIconPath.setAttribute("d", statusButtonIconPath);

  if (!settingsLoaded) {
    els.recordBtn.textContent = "Loading Settings...";
    els.recordBtn.disabled = true;
  } else if (!providerReady) {
    els.recordBtn.textContent = "Configure AI Provider";
    els.recordBtn.disabled = false;
  } else if (isRecording) {
    els.recordBtn.textContent = "Stop";
    els.recordBtn.disabled = false;
  } else if (isProcessing) {
    els.recordBtn.textContent = "Processing...";
    els.recordBtn.disabled = true;
  } else if (networkBlocked) {
    els.recordBtn.textContent = "Cloud Provider Offline";
    els.recordBtn.disabled = true;
  } else {
    els.recordBtn.textContent = "Start Recording";
    els.recordBtn.disabled = false;
  }

  const hasNote = (els.noteTextarea.value || "").trim().length > 0;
  els.copyBtn.disabled = !hasNote || isRecording || isProcessing;

  if (!settingsLoaded) {
    els.hintText.textContent = "Loading AI settings...";
    els.providerSummary.textContent = "Preparing provider configuration.";
  } else if (!providerReady) {
    els.hintText.textContent =
      "Choose a provider, add credentials or endpoint settings, and review the system instructions.";
    els.providerSummary.textContent = "AI provider not configured.";
  } else if (networkBlocked) {
    els.hintText.textContent =
      "The selected cloud provider needs a network connection before recording can begin.";
    els.providerSummary.textContent = `Using ${getProviderSummary(aiSettings)}`;
  } else if (uiState === "IDLE") {
    els.hintText.textContent =
      "Tip: Record the encounter, then stop to generate a SOAP note with your configured model.";
    els.providerSummary.textContent = `Using ${getProviderSummary(aiSettings)}`;
  } else if (uiState === "RECORDING") {
    els.hintText.textContent =
      "Recording... Stop when finished. Audio stays in memory until the note is generated or cleared.";
    els.providerSummary.textContent = `Using ${getProviderSummary(aiSettings)}`;
  } else if (uiState === "PROCESSING") {
    els.hintText.textContent =
      "Creating a mock transcript, then generating a SOAP note with the selected provider.";
    els.providerSummary.textContent = `Using ${getProviderSummary(aiSettings)}`;
  } else if (uiState === "DONE") {
    els.hintText.textContent =
      "Review the note, adjust it as needed, and copy it into the EHR when ready. You can switch encounters without losing the local draft.";
    els.providerSummary.textContent = `Using ${getProviderSummary(aiSettings)}`;
  } else if (uiState === "ERROR") {
    els.hintText.textContent = "Resolve the issue and try again, or hit Clear.";
    els.providerSummary.textContent = providerReady
      ? `Using ${getProviderSummary(aiSettings)}`
      : "AI provider not configured.";
  }
}

async function saveSettingsFromForm(event) {
  event.preventDefault();

  try {
    const nextSettings = readSettingsFromForm();
    aiSettings = await saveAiSettings(nextSettings);
    closeSettings();
    setAlert("");
    render();
  } catch (error) {
    setAlert(error instanceof Error ? error.message : "Failed to save settings.");
    setUiState("ERROR");
  }
}

/**
 * Starts microphone recording.
 */
async function handleStartRecording() {
  setAlert("");

  await flushActiveEncounterPersist();

  if (!isProviderConfigured(aiSettings)) {
    setAlert("Configure an AI provider before recording.");
    openSettings();
    setUiState("ERROR");
    return;
  }

  if (isNetworkBlocked()) {
    setAlert("The selected cloud provider is offline. Reconnect before recording.");
    setUiState("ERROR");
    return;
  }

  try {
    await audioService.startRecording();
    setUiState("RECORDING");
  } catch (error) {
    setAlert(error instanceof Error ? error.message : "Unable to start recording.");
    setUiState("ERROR");
  }
}

/**
 * Stops recording, produces a mock transcript, then calls the selected model.
 */
async function handleStopAndProcess() {
  setAlert("");
  setUiState("PROCESSING");

  try {
    const recording = await audioService.stopRecording();
    audioBlob = recording.audioBlob;

    const transcription = await mockTranscribeAudio(audioBlob, {
      durationMs: recording.durationMs
    });

    transcript = transcription.transcript;

    const result = await generateSoapNoteFromTranscript({
      transcript,
      meta: {
        durationMs: recording.durationMs,
        encounterContext: els.encounterContextInput.value
      },
      settings: aiSettings
    });

    soapNoteText = result.soapNoteText;

    els.noteTextarea.value = soapNoteText;
    els.transcriptPre.textContent = transcript;

    syncActiveEncounterDraftInMemory();
    await flushActiveEncounterPersist();
    setUiState("DONE");
  } catch (error) {
    setAlert(error instanceof Error ? error.message : "Processing failed.");
    setUiState("ERROR");
  } finally {
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
  } catch {
    setAlert(
      "Clipboard copy failed. Your browser may require a user gesture or additional permissions."
    );
    setUiState("ERROR");
  }
}

/**
 * Toggle record button behavior based on state.
 */
async function handleRecordButtonClick() {
  if (!settingsLoaded) return;

  if (!isProviderConfigured(aiSettings)) {
    setAlert("Configure an AI provider and system instructions before recording.");
    openSettings();
    return;
  }

  if (uiState === "RECORDING") {
    await handleStopAndProcess();
    return;
  }

  if (uiState === "PROCESSING") return;

  await handleStartRecording();
}

async function handleEncounterSelectionChange() {
  const nextEncounterId = els.encounterSelect.value;
  if (!nextEncounterId || nextEncounterId === encounterState.activeEncounterId) return;

  await flushActiveEncounterPersist();
  await persistEncounterState({
    ...encounterState,
    activeEncounterId: nextEncounterId
  });
  applyEncounterToUi(getActiveEncounter());
}

async function handleCreateEncounter() {
  if (uiState === "RECORDING" || uiState === "PROCESSING") return;

  await flushActiveEncounterPersist();

  const nextEncounter = createEncounterDraft();
  await persistEncounterState({
    activeEncounterId: nextEncounter.id,
    encounters: [nextEncounter, ...encounterState.encounters]
  });

  applyEncounterToUi(getActiveEncounter());
  els.encounterLabelInput.focus();
}

async function handleCloseEncounter() {
  if (uiState === "RECORDING" || uiState === "PROCESSING") return;

  const activeEncounter = getActiveEncounter();
  if (!activeEncounter) return;

  const encounterName = activeEncounter.label.trim() || "this encounter";
  const confirmed = window.confirm(
    `Close ${encounterName} and permanently remove its local draft data?`
  );

  if (!confirmed) return;

  cancelScheduledEncounterPersist();

  const remainingEncounters = encounterState.encounters.filter(
    (encounter) => encounter.id !== activeEncounter.id
  );

  const fallbackEncounter =
    remainingEncounters[0] || createEncounterDraft();

  await persistEncounterState({
    activeEncounterId: fallbackEncounter.id,
    encounters:
      remainingEncounters.length > 0 ? remainingEncounters : [fallbackEncounter]
  });

  applyEncounterToUi(getActiveEncounter());
}

function bindEvents() {
  els.statusButton.addEventListener("click", () => {
    if (!settingsLoaded || !isProviderConfigured(aiSettings)) {
      openSettings();
      return;
    }

    void handleRecordButtonClick();
  });

  els.recordBtn.addEventListener("click", () => {
    void handleRecordButtonClick();
  });

  els.copyBtn.addEventListener("click", () => {
    void handleCopyToClipboard();
  });

  els.clearBtn.addEventListener("click", () => {
    void clearAllEphemeralData();
  });
  els.newEncounterBtn.addEventListener("click", () => {
    void handleCreateEncounter();
  });
  els.closeEncounterBtn.addEventListener("click", () => {
    void handleCloseEncounter();
  });
  els.encounterSelect.addEventListener("change", () => {
    void handleEncounterSelectionChange();
  });
  els.encounterLabelInput.addEventListener("input", () => {
    syncActiveEncounterDraftInMemory();
    renderEncounterOptions();
    updateEncounterMeta();
    scheduleActiveEncounterPersist();
  });
  els.encounterContextInput.addEventListener("input", () => {
    syncActiveEncounterDraftInMemory();
    updateEncounterMeta();
    scheduleActiveEncounterPersist();
  });
  els.settingsBtn.addEventListener("click", openSettings);
  els.themeToggleBtn.addEventListener("click", toggleThemeMode);
  els.settingsCloseBtn.addEventListener("click", closeSettings);
  els.cancelSettingsBtn.addEventListener("click", closeSettings);
  els.resetPromptBtn.addEventListener("click", () => {
    els.systemPromptInput.value = DEFAULT_SYSTEM_PROMPT;
  });
  els.providerSelect.addEventListener("change", syncProviderFieldVisibility);
  els.settingsForm.addEventListener("submit", (event) => {
    void saveSettingsFromForm(event);
  });

  els.settingsOverlay.addEventListener("click", (event) => {
    if (event.target === els.settingsOverlay) {
      closeSettings();
    }
  });

  els.noteTextarea.addEventListener("input", () => {
    soapNoteText = els.noteTextarea.value;
    syncActiveEncounterDraftInMemory();
    render();
    scheduleActiveEncounterPersist();
  });

  window.addEventListener("beforeunload", () => {
    cancelScheduledEncounterPersist();
    void persistActiveEncounterDraft();

    if (uiState === "RECORDING") {
      audioService.cancelAndClear();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && uiState === "RECORDING") {
      audioService.cancelAndClear();
      setAlert("Recording stopped because the panel was hidden.");
      setUiState("ERROR");
      return;
    }

    if (document.visibilityState === "hidden") {
      cancelScheduledEncounterPersist();
      void persistActiveEncounterDraft();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSettingsOpen) {
      closeSettings();
    }
  });

  window.addEventListener("online", render);
  window.addEventListener("offline", render);
}

async function initialize() {
  themeMode = getInitialThemeMode();
  applyThemeMode();
  bindEvents();
  render();

  aiSettings = await loadAiSettings();
  encounterState = await loadEncounterState();

  if (encounterState.encounters.length === 0) {
    const initialEncounter = createEncounterDraft();
    encounterState = await saveEncounterState({
      activeEncounterId: initialEncounter.id,
      encounters: [initialEncounter]
    });
  }

  renderEncounterOptions();
  updateEncounterMeta();
  applyEncounterToUi(getActiveEncounter());
  settingsLoaded = true;
  populateSettingsForm(aiSettings);
  render();
}

initialize().catch((error) => {
  console.error("Failed to initialize JoyScribe:", error);
  setAlert(error instanceof Error ? error.message : "Failed to initialize JoyScribe.");
  settingsLoaded = true;
  setUiState("ERROR");
});
