# JoyScribe-UC TODO

This backlog reflects the current prototype as of 2026-06-06.

Implemented baseline:

- Chrome MV3 side panel.
- In-browser audio recording.
- Mock transcription.
- Provider-backed SOAP note generation for OpenAI and Google Gemini API-key authentication.
- Selectable but blocked auth modes for ChatGPT subscription and Gemini subscription forwarding.
- Editable provider settings and system instructions.
- Local open-encounter draft persistence.
- Copy-to-clipboard export.

## Now

- [ ] Replace mock transcription with a real STT provider or a clearly defined local transcription path.
- [ ] Decide whether transcription is provider-specific or routed through one standard transcription service.
- [ ] Add an automated test harness for pure service modules.
- [ ] Add tests for provider settings normalization and provider request payload construction.
- [ ] Add provider connectivity checks or a "Test connection" flow in settings.
- [ ] Improve provider error handling for invalid keys, quota failures, model not found, non-JSON responses, empty responses, and timeouts.
- [ ] Add a secure subscription forwarding design for ChatGPT and Gemini subscription modes.
- [ ] Confirm how credentials and subscription auth handoffs should be handled beyond local extension storage.

## Next

- [ ] Add transcript-to-note traceability so clinicians can see where generated content came from.
- [ ] Add note-generation options for urgent care template variants and output style controls.
- [ ] Add a privacy summary in settings that states which provider receives note-generation requests.
- [ ] Add a synthetic or approved de-identified golden dataset for prompt regression.
- [ ] Add browser workflow smoke tests for encounter switching, recording, settings, and provider failure states.
- [ ] Add lightweight diagnostics without persisting PHI unsafely.

## Pilot Readiness

- [ ] Define a HIPAA-aligned architecture before handling real PHI.
- [ ] Define retention, deletion, and audit requirements.
- [ ] Add authentication and workspace-level configuration.
- [ ] Define provider support policy for clinic deployments.
- [ ] Decide whether Azure OpenAI, local models, or other providers belong in the post-MVP provider matrix.
- [ ] Define note usefulness and latency acceptance criteria for pilot use.
- [ ] Decide whether the Chrome extension remains the delivery model for pilot customers.
- [ ] Establish a secure backend path if direct-from-extension provider calls are not acceptable.

## Workflow Expansion

- [ ] Add EHR integration beyond clipboard export.
- [ ] Expand encounter context capture beyond the current free-text field.
- [ ] Evaluate specialty support beyond urgent care.
- [ ] Consider structured output for downstream workflows only after the SOAP workflow is stable.

## Documentation Maintenance

- [ ] Update `README.md`, `PRD.md`, `TESTING.md`, `TODO.md`, and `OPERATING_PROCEDURES.md` whenever implemented behavior changes.
- [ ] Keep all local paths pointed at `C:\Users\Jigs\CODE\VT-JoyScribe`.
- [ ] Separate product intent from implemented behavior in docs.
