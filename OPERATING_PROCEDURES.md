# JoyScribe-UC Operating Procedures

This document is the standing rule set for continuing JoyScribe-UC development. Keep it current whenever the project direction changes.

## 1. Source of Truth

- The current checkout is the authority for implemented behavior.
- `PRD.md` describes product intent and roadmap.
- `README.md` describes how the current repo works.
- `TESTING.md` describes required verification.
- `TODO.md` tracks the active backlog.
- This file defines development rules and standard operating procedures.

When docs and code disagree, inspect the code, update the docs, and call out any product decision that remains unresolved.

## 2. Clinical Safety Rules

- JoyScribe is a documentation assistant, not a diagnostic or treatment system.
- Generated notes must always be editable and must never be presented as final.
- Prompts and UI copy must instruct the model not to invent vitals, exam findings, diagnoses, medications, tests, or follow-up details.
- Missing clinically important information should be represented as `Not documented`.
- Any feature that could look like medical decision support requires an explicit product decision before implementation.

## 3. Privacy and PHI Rules

- Do not test with real PHI unless the architecture, provider account, storage, and compliance posture are explicitly approved for that use.
- Do not persist recorded audio.
- Do not add analytics, logs, crash reports, URLs, or telemetry that include transcript, note, patient label, encounter context, credentials, or other PHI-like content.
- Keep local draft persistence explicit in the UI and documentation.
- Any new persistence location must document what is stored, why it is stored, how it is deleted, and whether it may contain PHI.
- Any cloud provider integration must document what data is transmitted.

## 4. Architecture Rules

- Keep side panel UI behavior in `sidepanel/sidepanel.js`.
- Keep provider settings normalization in `services/aiConfigService.js`.
- Keep provider request logic in `services/aiProviderService.js`.
- Keep encounter persistence in `services/encounterStorageService.js`.
- Keep audio capture in `services/audioService.js`.
- Keep transcription behind a service boundary. Replace `services/mockAiService.js` rather than spreading transcription logic through the UI.
- Do not add a backend, build system, dependency manager, or framework without a clear reason and a documentation update.
- Do not forward prompts through ChatGPT or Gemini subscription auth modes until a secure auth handoff and forwarding path are explicitly designed and implemented.

## 5. Provider Integration SOP

Before adding or changing a provider:

1. Document required settings and data transmission behavior.
2. Add or update provider configuration normalization.
3. Add request payload construction in the provider service.
4. Parse provider errors into actionable user-facing messages.
5. Keep model output constrained to the expected SOAP note shape.
6. Update the manual provider test matrix in `TESTING.md`.
7. Add automated tests when the test harness exists.

Current note-generation provider scope:

- OpenAI API-key authentication is implemented.
- Gemini API-key authentication is implemented.
- ChatGPT subscription forwarding is selectable but intentionally blocked.
- Gemini subscription forwarding is selectable but intentionally blocked.

## 6. Storage SOP

Before changing storage:

1. Identify the storage key and data shape.
2. Decide whether the data can contain PHI-like content.
3. Define deletion behavior.
4. Confirm encounter switching cannot mix drafts.
5. Update `README.md`, `TESTING.md`, and this file if behavior changes.

Current storage keys:

- `joyscribe-ai-settings`: provider settings and system instructions in Chrome extension local storage.
- `joyscribe-encounter-state`: open encounter draft state in Chrome extension local storage.
- `joyscribe-theme`: theme preference in browser local storage.

## 7. Testing SOP

For every behavior change:

1. Run the relevant manual checklist in `TESTING.md`.
2. Verify at least one happy path and one failure path for touched provider or storage behavior.
3. Update `TESTING.md` when the expected behavior changes.
4. Prefer pure service-module tests before browser automation when adding automated coverage.

Minimum verification before marking a prototype change done:

- Side panel opens.
- Settings load.
- One encounter exists.
- Encounter draft persistence works.
- Recording starts and stops.
- Mock transcript appears.
- Provider note generation succeeds or fails with a clear error.
- No new unexpected persistence of audio, transcript, note, credentials, or context is introduced.

## 8. Documentation SOP

Documentation must be updated in the same change as behavior changes.

- Use absolute local path `C:\Users\Jigs\CODE\VT-JoyScribe` only where a machine-specific path is necessary.
- Use repository-relative paths for source files in normal documentation.
- Date major document state changes.
- Keep prototype limitations visible.
- Separate "implemented today" from "planned later".

## 9. Product Decision Log

Record unresolved decisions in `PRD.md` or `TODO.md` rather than burying them in code comments.

Current open decisions:

- First real STT provider or local transcription path.
- Credential handling beyond local extension storage.
- HIPAA-aligned architecture for real PHI.
- Whether Chrome extension remains the pilot delivery model.
- Minimum note usefulness and latency targets for pilot readiness.

## 10. Completion Checklist

Before ending a development task:

- Code matches the requested behavior.
- Docs match the new behavior.
- Manual or automated verification is recorded in the final response.
- Any untested area is called out clearly.
- No unrelated local changes are reverted.
