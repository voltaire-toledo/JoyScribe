# JoyScribe-UC Testing Plan

This plan reflects the current prototype as of 2026-06-06. There is no automated test harness in the repository yet, so manual extension testing is required after behavior changes.

## Current Test Stack

1. Manual Chrome extension workflow tests.
2. Provider happy-path and failure-path checks.
3. Provider happy-path checks with API-key authentication.
4. Future deterministic unit tests for storage normalization, settings normalization, and provider payload construction.
5. Future golden-set review using archived synthetic or approved de-identified urgent care encounters.

## Required Manual Smoke Test

Run this after changes to `manifest.json`, `background/`, `sidepanel/`, or `services/`.

1. Load the unpacked extension from `C:\Users\Jigs\CODE\VT-JoyScribe`.
2. Click the extension action and confirm the side panel opens.
3. Confirm one blank encounter exists on first load.
4. Enter a patient label and encounter context.
5. Close and reopen the side panel and confirm the draft restores.
6. Create a second encounter, switch between encounters, and confirm label, context, note, and transcript do not mix.
7. Clear the active draft and confirm the label remains while context, note, and transcript are cleared.
8. Close an encounter and confirm its draft disappears from the switcher.
9. Toggle light/dark mode and confirm the selection persists.
10. Open settings, change provider fields, cancel, and confirm unsaved edits are discarded.
11. Save settings and confirm provider summary updates.

## Recording Workflow Test

Run this after changes to recording, visibility handling, note generation, or provider settings.

1. Configure a provider with OpenAI API-key or Gemini API-key authentication.
2. Start recording and grant microphone permission.
3. Stop recording.
4. Confirm the UI enters processing state.
5. Confirm the transcript panel is populated with the mock transcript.
6. Confirm the note textarea is populated by the selected provider.
7. Confirm the note follows these exact section headers:
   - `SUBJECTIVE`
   - `OBJECTIVE`
   - `ASSESSMENT`
   - `PLAN`
8. Confirm the note can be copied to the clipboard.
9. Start recording again, hide the panel, and confirm recording is stopped with an actionable error.

## Provider Coverage

For each implemented API-key provider mode, run one successful note-generation test and one failure-path test.

- OpenAI API key
- Gemini API key

For selectable subscription modes, confirm note generation is blocked with an actionable message until secure forwarding exists.

- ChatGPT subscription
- Gemini subscription

Failure cases to check:

- Missing API key.
- Invalid model name.
- Offline network state for cloud providers.
- Provider returns non-JSON or empty content.

## Storage and Privacy Checks

Verify the following whenever storage behavior changes:

- Audio remains in memory only and is cleared after processing or cancellation.
- `joyscribe-encounter-state` stores only open encounter drafts.
- `joyscribe-ai-settings` stores provider settings and editable system instructions.
- Closing an encounter removes that encounter's local draft data.
- Clearing a draft removes context, note, and transcript from the active encounter.
- No new PHI-like data is written to console logs, analytics, URL query strings, or long-lived storage.

## Prompt Quality Regression Set

Use synthetic or approved de-identified examples only until a HIPAA-aligned process is defined.

Maintain 10 to 20 representative urgent care transcripts:

- Sore throat or URI.
- Abdominal pain.
- UTI symptoms.
- Laceration follow-up.
- Rash or allergic reaction.
- Fever in child.
- Chest pain sent to ED.
- Work note or return-to-work visit.
- Medication refill request.
- Sparse documentation where the model must avoid guessing.

Review generated notes for:

- Grounding: no invented diagnoses, vitals, meds, tests, or follow-up details.
- Completeness: key symptoms, exam details, and plan elements are captured when present.
- Structure: exact SOAP section headers.
- Restraint: missing information is marked as `Not documented`.
- Edit burden: clinician should need light cleanup, not a rewrite.

## Automation Backlog

Automate in this order:

1. `normalizeAiSettings`, provider configuration checks, and provider summary behavior.
2. `normalizeEncounterState`, duplicate encounter handling, active encounter selection, and draft creation.
3. Provider request payload construction using mocked `fetch`.
4. Error parsing and provider response extraction.
5. Side panel workflow smoke tests with browser automation.
6. Fixture-based prompt regression checks.

## MVP Acceptance Criteria

Treat a build as acceptable for prototype continuation only if:

- Encounter switching never mixes drafts between patients.
- Closing an encounter removes its stored local draft data.
- Recording failure paths are clear and recoverable.
- Note generation works with at least one configured provider.
- The model follows the required SOAP format.
- The docs and `OPERATING_PROCEDURES.md` match the behavior being shipped.
