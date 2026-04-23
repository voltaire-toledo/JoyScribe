/**
 * services/aiConfigService.js
 * Persists provider settings and editable system instructions in extension storage.
 */

export const AI_SETTINGS_STORAGE_KEY = "joyscribe-ai-settings";

export const PROVIDERS = Object.freeze({
  openai: "openai",
  gemini: "gemini",
  azure: "azure",
  ollama: "ollama"
});

export const DEFAULT_SYSTEM_PROMPT = `You are JoyScribe, a clinical documentation assistant for urgent care visits.

Your job is to draft a SOAP note from the provided encounter transcript.

Rules:
- Use only information grounded in the transcript and supplied metadata.
- Do not invent vitals, exam findings, diagnoses, medications, tests, or follow-up details.
- If a clinically important detail is missing, state "Not documented" instead of guessing.
- Keep the note concise, clinically readable, and ready for clinician review.
- Output plain text suitable for direct copy/paste into an EHR.
- Do not include meta commentary, safety disclaimers, markdown fences, or references to being an AI assistant.
- Follow the requested SOAP structure exactly.`;

export const DEFAULT_AI_SETTINGS = Object.freeze({
  provider: PROVIDERS.openai,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  openai: {
    apiKey: "",
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1"
  },
  gemini: {
    apiKey: "",
    model: "gemini-2.5-flash"
  },
  azure: {
    apiKey: "",
    endpoint: "",
    model: ""
  },
  ollama: {
    endpoint: "http://127.0.0.1:11434",
    model: "llama3.1:8b"
  }
});

function getStorageArea() {
  return globalThis.chrome?.storage?.local || null;
}

function storageGet(key) {
  const storageArea = getStorageArea();
  if (!storageArea) return Promise.resolve({});

  return new Promise((resolve, reject) => {
    storageArea.get(key, (result) => {
      if (globalThis.chrome?.runtime?.lastError) {
        reject(new Error(globalThis.chrome.runtime.lastError.message));
        return;
      }
      resolve(result || {});
    });
  });
}

function storageSet(value) {
  const storageArea = getStorageArea();
  if (!storageArea) return Promise.resolve();

  return new Promise((resolve, reject) => {
    storageArea.set(value, () => {
      if (globalThis.chrome?.runtime?.lastError) {
        reject(new Error(globalThis.chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

function normalizeOpenAiConfig(config = {}) {
  return {
    apiKey: typeof config.apiKey === "string" ? config.apiKey.trim() : "",
    model: typeof config.model === "string" && config.model.trim()
      ? config.model.trim()
      : DEFAULT_AI_SETTINGS.openai.model,
    baseUrl: typeof config.baseUrl === "string" && config.baseUrl.trim()
      ? config.baseUrl.trim()
      : DEFAULT_AI_SETTINGS.openai.baseUrl
  };
}

function normalizeGeminiConfig(config = {}) {
  return {
    apiKey: typeof config.apiKey === "string" ? config.apiKey.trim() : "",
    model: typeof config.model === "string" && config.model.trim()
      ? config.model.trim()
      : DEFAULT_AI_SETTINGS.gemini.model
  };
}

function normalizeAzureConfig(config = {}) {
  return {
    apiKey: typeof config.apiKey === "string" ? config.apiKey.trim() : "",
    endpoint: typeof config.endpoint === "string" ? config.endpoint.trim() : "",
    model: typeof config.model === "string" ? config.model.trim() : ""
  };
}

function normalizeOllamaConfig(config = {}) {
  return {
    endpoint: typeof config.endpoint === "string" && config.endpoint.trim()
      ? config.endpoint.trim()
      : DEFAULT_AI_SETTINGS.ollama.endpoint,
    model: typeof config.model === "string" && config.model.trim()
      ? config.model.trim()
      : DEFAULT_AI_SETTINGS.ollama.model
  };
}

export function normalizeAiSettings(rawSettings = {}) {
  const provider = Object.values(PROVIDERS).includes(rawSettings.provider)
    ? rawSettings.provider
    : DEFAULT_AI_SETTINGS.provider;

  return {
    provider,
    systemPrompt: typeof rawSettings.systemPrompt === "string"
      ? rawSettings.systemPrompt
      : DEFAULT_AI_SETTINGS.systemPrompt,
    openai: normalizeOpenAiConfig(rawSettings.openai),
    gemini: normalizeGeminiConfig(rawSettings.gemini),
    azure: normalizeAzureConfig(rawSettings.azure),
    ollama: normalizeOllamaConfig(rawSettings.ollama)
  };
}

export async function loadAiSettings() {
  try {
    const stored = await storageGet(AI_SETTINGS_STORAGE_KEY);
    return normalizeAiSettings(stored[AI_SETTINGS_STORAGE_KEY]);
  } catch (error) {
    console.warn("Failed to load AI settings:", error);
    return normalizeAiSettings();
  }
}

export async function saveAiSettings(nextSettings) {
  const normalized = normalizeAiSettings(nextSettings);
  await storageSet({ [AI_SETTINGS_STORAGE_KEY]: normalized });
  return normalized;
}

export function getActiveProviderConfig(settings) {
  const normalized = normalizeAiSettings(settings);
  return normalized[normalized.provider];
}

export function isProviderConfigured(settings) {
  const normalized = normalizeAiSettings(settings);

  if (normalized.provider === PROVIDERS.openai) {
    return Boolean(normalized.openai.apiKey && normalized.openai.model);
  }

  if (normalized.provider === PROVIDERS.gemini) {
    return Boolean(normalized.gemini.apiKey && normalized.gemini.model);
  }

  if (normalized.provider === PROVIDERS.azure) {
    return Boolean(
      normalized.azure.apiKey && normalized.azure.endpoint && normalized.azure.model
    );
  }

  if (normalized.provider === PROVIDERS.ollama) {
    return Boolean(normalized.ollama.endpoint && normalized.ollama.model);
  }

  return false;
}

export function getProviderDisplayName(provider) {
  if (provider === PROVIDERS.openai) return "OpenAI";
  if (provider === PROVIDERS.gemini) return "Google Gemini";
  if (provider === PROVIDERS.azure) return "Azure OpenAI";
  if (provider === PROVIDERS.ollama) return "Ollama";
  return "Unknown";
}

export function getProviderSummary(settings) {
  const normalized = normalizeAiSettings(settings);
  const activeConfig = getActiveProviderConfig(normalized);
  const modelName = activeConfig?.model || "Model not set";
  return `${getProviderDisplayName(normalized.provider)} · ${modelName}`;
}
