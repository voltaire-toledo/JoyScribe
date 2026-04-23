# JoyScribe Product Requirements Document

## 1. Document Summary

- Product: JoyScribe
- Working title in code: JoyScribe-UC
- Product type: Chrome extension with a side panel workflow
- Primary use case: Assist urgent care clinicians by turning encounter audio into an editable SOAP note draft
- Document status: Draft v1.1 updated for provider-backed note generation as of 2026-03-30

## 2. Current Reality

The current repository is an early prototype, not a production-ready clinical product.

What exists today:

- A Manifest V3 Chrome extension that opens a side panel UI
- Microphone recording in-browser via `MediaRecorder`
- Mock transcription from recorded audio
- Provider-backed SOAP note generation using configurable OpenAI, Google Gemini, Azure OpenAI, or Ollama models
- A settings flow for provider selection, model configuration, local credential storage, and editable system instructions
- An editable note field plus transcript disclosure panel
- Copy-to-clipboard workflow for transferring the generated note elsewhere
- Local encounter draft storage in browser extension storage for open encounters, with no backend persistence

What does not exist today:

- Real speech-to-text
- Authentication
- EHR integrations
- Structured patient/context capture
- Auditing, logging, admin controls, or enterprise deployment features
- HIPAA-grade security/compliance implementation

## 3. Product Vision

JoyScribe helps urgent care clinicians reduce documentation time by converting spoken encounter details into a structured, editable SOAP note draft inside a lightweight side-panel workflow.

The product should feel fast, clinically useful, and safe by default:

- Fast enough to fit inside a live visit workflow
- Editable so clinicians remain in control of final documentation
- Transparent about confidence, limitations, and generated content
- Private and compliant enough for clinical deployment

## 4. Problem Statement

Urgent care clinicians lose time and attention to visit documentation. Manual note entry after or during visits increases cognitive load, reduces patient-facing time, and contributes to burnout.

Existing documentation workflows are often:

- Slow and repetitive
- Disconnected from the live conversation
- Hard to use alongside browser-based tools and EHRs
- Not optimized for short, high-volume urgent care encounters

JoyScribe should reduce time-to-draft while keeping clinicians responsible for review and sign-off.

## 5. Target Users

### Primary User

- Urgent care clinicians, including physicians, nurse practitioners, and physician assistants

### Secondary Users

- Medical assistants or scribes who support documentation workflows
- Clinical operations leaders evaluating throughput and documentation quality
- Compliance and IT stakeholders who must approve deployment

## 6. Core Jobs To Be Done

- Capture an encounter without forcing the clinician to type throughout the visit
- Convert raw conversation into a SOAP-formatted first draft
- Let the clinician quickly edit and copy the note into the EHR
- Keep PHI exposure minimal and well understood
- Avoid slowing down the clinic workflow

## 7. Product Scope

### In Scope for MVP

- Browser extension side panel experience
- Start/stop encounter recording
- Upload or stream audio to a transcription service
- Generate a SOAP note draft from transcript plus encounter context using a configurable model provider
- Show generated note and optional transcript in the side panel
- Allow clinician edits before export
- Copy note to clipboard
- Explicit session clear/delete controls
- Reliability and permission handling for microphone capture
- Transparent system instructions that clinicians or admins can inspect and modify

### Out of Scope for MVP

- Autonomous chart completion without clinician review
- Medical decision support or diagnosis recommendations
- Order entry, coding, billing, or prescribing
- Full longitudinal patient record management
- Native desktop/mobile apps
- Broad specialty support beyond urgent care

## 8. MVP Goals

### Business Goals

- Prove clinicians will use a browser-based ambient documentation assistant during urgent care visits
- Demonstrate reduction in documentation effort and time-to-note
- Establish a credible path to pilot deployments

### User Goals

- Produce a usable first-draft SOAP note within minutes of encounter completion
- Minimize clicks and context switching
- Keep editing effort substantially lower than writing from scratch

### Product Goals

- Deliver a dependable narrow workflow that works for urgent care visits
- Preserve clinician control and trust
- Build a foundation for secure real-AI integration

## 9. Success Metrics

### Primary Metrics

- Median time from recording stop to note draft under 60 seconds
- At least 70% of pilot encounters produce a note clinicians rate as "useful first draft"
- At least 50% reduction in clinician editing time versus manual drafting baseline

### Secondary Metrics

- Recording start success rate above 98%
- Note generation success rate above 95%
- Less than 5% of sessions abandoned because of permissions, performance, or UI confusion
- Average clinician satisfaction score of 4/5 or higher in pilot feedback

## 10. User Experience Principles

- One primary action per state
- Generated text is always editable
- The product never implies the note is final or clinically validated
- Privacy behavior is explicit and easy to understand
- Errors are actionable, not vague
- The interface should support rapid, repeated use throughout a shift

## 11. Primary User Flow

1. Clinician opens JoyScribe from the Chrome toolbar.
2. Side panel opens and shows recording readiness state.
3. Clinician starts recording at the beginning of a visit.
4. JoyScribe captures encounter audio.
5. Clinician stops recording when the visit ends.
6. JoyScribe transcribes audio and generates a SOAP note draft.
7. Clinician reviews and edits the note.
8. Clinician optionally expands the transcript for reference.
9. Clinician copies the final note into the EHR.
10. Clinician clears session data.

## 12. Functional Requirements

### Recording

- The system must request microphone permission before recording.
- The system must clearly indicate idle, recording, processing, done, and error states.
- The system must let the user stop recording manually.
- The system should stop recording safely if the panel is hidden, closed, or interrupted.

### Note Generation

- The system must generate a SOAP-formatted draft from encounter audio.
- The system must support configurable note generation providers, initially OpenAI, Google Gemini, Azure OpenAI, and Ollama.
- The system must allow the user to inspect and edit the system instructions sent to the selected model.
- The system should preserve clinically relevant structure: chief complaint, HPI, ROS, objective findings, assessment, and plan.
- The system must surface generation failures clearly and allow retry.
- The system should show progress while processing.

### Review and Export

- The system must present the generated note in an editable text field.
- The system may show the transcript behind a collapsible control.
- The system must allow note copying with one user action.
- The system must provide a clear action that removes note, transcript, and audio from session memory.

### Session Privacy

- The system must state whether data is stored, transmitted, or retained.
- The system should default to minimum necessary retention.
- The system must avoid silent persistence of PHI in local storage, analytics, or logs.
- If local draft persistence is enabled for open encounters, the UI must state that behavior clearly and provide an explicit close/delete action that purges the session.

### Settings and Controls

- The system should provide settings for AI provider, model selection, editable system instructions, note style, transcript visibility default, and privacy controls.
- The system should support theme and accessibility preferences without affecting clinical workflow.

## 13. Non-Functional Requirements

### Performance

- Side panel should become interactive in under 2 seconds on supported machines.
- Recording start should feel immediate, ideally under 500 ms after permission grant.
- Note generation should usually complete in under 60 seconds.

### Reliability

- The system should degrade gracefully on network failure, permission denial, or provider timeout.
- The system should recover without requiring extension reinstall or browser restart.

### Security and Compliance

- Production versions must support a HIPAA-aligned architecture and BAAs where applicable.
- PHI must be encrypted in transit and at rest whenever persisted or transmitted.
- Access to generated notes, transcripts, and logs must be tightly controlled.
- Auditability requirements must be defined before pilot deployment.

### Accessibility

- Core controls must be keyboard accessible.
- Status changes and alerts must be screen-reader friendly.
- Visual states must maintain sufficient contrast.

## 14. Clinical and Safety Guardrails

- JoyScribe is a documentation assistant, not a diagnostic system.
- The clinician remains responsible for validating note accuracy.
- The product must clearly communicate that generated notes may contain omissions or inaccuracies.
- The product must not fabricate vitals, labs, diagnoses, or treatment details without basis in source inputs and configured rules.
- The product must support safe handling of uncertainty, missing details, and ambiguous speech.

## 15. Key Risks

- Hallucinated clinical content reduces trust and creates patient-safety risk.
- Audio quality and urgent care workflow variability degrade transcription accuracy.
- Browser-extension constraints may limit enterprise deployment and EHR interoperability.
- Compliance expectations may exceed what a client-only extension can safely support.
- Clinicians may reject the workflow if copy/paste into the EHR is slower than expected.

## 16. Assumptions

- Initial users are already documenting in browser-accessible systems.
- Urgent care visits are short enough that a side-panel workflow is acceptable.
- Copy/paste export is sufficient for early pilots before full EHR integration.
- Early value can be proven with note drafting before broader feature expansion.

## 17. Open Questions

- Should JoyScribe remain a Chrome extension long term, or is the extension only a prototype delivery vehicle?
- Will production recording be full-visit ambient capture, push-to-talk capture, or manual start/stop only?
- Is transcript visibility desirable by default, or should it remain secondary?
- Which EHRs matter first for pilot adoption?
- What level of structured encounter context should be captured before generation?
- What retention policy is acceptable for pilot customers?
- What minimum quality bar is required before a real-clinic pilot?

## 18. Recommended Roadmap

### Phase 0: Prototype Stabilization

- Tighten UI states, permission errors, and empty-state handling
- Add installation, provider setup, and developer documentation
- Add local test coverage for provider settings and request shaping
- Decide how secrets should be handled beyond local extension storage

### Phase 1: Functional MVP

- Integrate real STT provider
- Improve transcript-to-note traceability
- Harden provider request flow, timeouts, and retries
- Add secure request flow and secrets handling
- Add configurable note templates for urgent care

### Phase 2: Pilot Readiness

- Add auth and workspace controls
- Add retention, deletion, and audit behaviors
- Add admin configuration and provider controls
- Add reliability monitoring and usage analytics without exposing PHI unsafely

### Phase 3: Workflow Expansion

- Add EHR insertion/integration paths
- Add specialty variants beyond urgent care
- Add structured output options and downstream workflows

## 19. Immediate Product Decisions

To move from prototype to execution, the next decisions should be:

1. Confirm the product positioning: browser-based urgent care scribe versus broader medical documentation assistant.
2. Confirm MVP boundary: copy-to-clipboard prototype versus integrated clinical pilot tool.
3. Choose the first real STT provider and define the supported provider quality bar for note generation.
4. Define privacy/compliance architecture before handling real PHI.
5. Set a measurable usefulness target for pilot notes.

## 20. Appendix: Codebase Evidence

The current PRD is grounded in the repository's present implementation:

- The extension is defined as a Chrome MV3 side panel in [manifest.json](/Users/me/CODE/gh-me/JoyScribe/manifest.json).
- Recording behavior is implemented in [audioService.js](/Users/me/CODE/gh-me/JoyScribe/services/audioService.js).
- Mock transcription is implemented in [mockAiService.js](/Users/me/CODE/gh-me/JoyScribe/services/mockAiService.js).
- Provider settings and editable system instructions are implemented in [aiConfigService.js](/Users/me/CODE/gh-me/JoyScribe/services/aiConfigService.js).
- Provider-backed note generation is implemented in [aiProviderService.js](/Users/me/CODE/gh-me/JoyScribe/services/aiProviderService.js).
- The user workflow and ephemeral messaging are implemented in [sidepanel.js](/Users/me/CODE/gh-me/JoyScribe/sidepanel/sidepanel.js) and [sidepanel.html](/Users/me/CODE/gh-me/JoyScribe/sidepanel/sidepanel.html).
