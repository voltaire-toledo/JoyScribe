/**
 * services/encounterStorageService.js
 * Persists open encounter drafts in local extension storage so clinicians can
 * switch between patients during a shift. Audio is never stored here.
 */

export const ENCOUNTER_STORAGE_KEY = "joyscribe-encounter-state";

const EMPTY_ENCOUNTER_STATE = Object.freeze({
  activeEncounterId: "",
  encounters: []
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

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function createEncounterId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `encounter-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeEncounter(rawEncounter = {}) {
  const id = typeof rawEncounter.id === "string" && rawEncounter.id.trim()
    ? rawEncounter.id.trim()
    : createEncounterId();

  const nowIso = new Date().toISOString();
  const createdAt = typeof rawEncounter.createdAt === "string" && rawEncounter.createdAt.trim()
    ? rawEncounter.createdAt
    : nowIso;
  const updatedAt = typeof rawEncounter.updatedAt === "string" && rawEncounter.updatedAt.trim()
    ? rawEncounter.updatedAt
    : createdAt;

  return {
    id,
    label: normalizeText(rawEncounter.label),
    context: normalizeText(rawEncounter.context),
    transcript: normalizeText(rawEncounter.transcript),
    noteText: normalizeText(rawEncounter.noteText),
    createdAt,
    updatedAt
  };
}

export function createEncounterDraft(overrides = {}) {
  return normalizeEncounter(overrides);
}

export function normalizeEncounterState(rawState = {}) {
  const encounters = Array.isArray(rawState.encounters)
    ? rawState.encounters.map((encounter) => normalizeEncounter(encounter))
    : [];

  const uniqueEncounters = [];
  const seenIds = new Set();

  for (const encounter of encounters) {
    if (seenIds.has(encounter.id)) continue;
    seenIds.add(encounter.id);
    uniqueEncounters.push(encounter);
  }

  const requestedActiveId = typeof rawState.activeEncounterId === "string"
    ? rawState.activeEncounterId
    : "";
  const activeEncounterId =
    uniqueEncounters.some((encounter) => encounter.id === requestedActiveId)
      ? requestedActiveId
      : uniqueEncounters[0]?.id || "";

  return {
    activeEncounterId,
    encounters: uniqueEncounters
  };
}

export async function loadEncounterState() {
  try {
    const stored = await storageGet(ENCOUNTER_STORAGE_KEY);
    return normalizeEncounterState(stored[ENCOUNTER_STORAGE_KEY]);
  } catch (error) {
    console.warn("Failed to load encounter state:", error);
    return normalizeEncounterState(EMPTY_ENCOUNTER_STATE);
  }
}

export async function saveEncounterState(nextState) {
  const normalized = normalizeEncounterState(nextState);
  await storageSet({ [ENCOUNTER_STORAGE_KEY]: normalized });
  return normalized;
}
