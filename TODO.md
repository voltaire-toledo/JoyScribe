# JoyScribe TODO

This file tracks the remaining work after the current prototype milestone:

- Real provider-backed SOAP note generation is implemented.
- Audio transcription is still mocked.
- The product is still prototype-grade and not pilot-ready.

## Now

- [ ] Replace mock transcription with a real STT provider and define the supported transcription path.
- [ ] Decide whether transcription should be provider-specific or routed through one standard STT service.
- [ ] Add validation and test coverage for provider settings and request payload generation.
- [ ] Add provider connectivity checks or a "Test connection" flow in settings.
- [ ] Improve provider error handling for invalid keys, quota failures, model not found, and timeouts.
- [ ] Add guidance in the UI for Azure endpoint and deployment-name configuration.

## Next

- [ ] Add note-generation options such as urgent care template variants and output style controls.
- [ ] Add transcript-to-note traceability so clinicians can understand where generated content came from.
- [ ] Add a clearer privacy summary in settings explaining which providers receive note-generation requests.
- [ ] Decide how provider credentials should be handled beyond local extension storage.
- [ ] Add lightweight analytics and diagnostics without persisting PHI unsafely.

## Pilot Readiness

- [ ] Define a HIPAA-aligned architecture for real PHI handling.
- [ ] Add authentication and workspace-level configuration.
- [ ] Add retention, deletion, and audit requirements.
- [ ] Define provider support policy for clinic deployments.
- [ ] Define note usefulness and latency acceptance criteria for pilot use.
- [ ] Evaluate whether the Chrome extension remains the delivery model for pilot customers.

## Workflow Expansion

- [ ] Add EHR integration beyond clipboard export.
- [ ] Expand encounter context capture beyond the current free-text local draft field.
- [ ] Evaluate specialty support beyond urgent care.
