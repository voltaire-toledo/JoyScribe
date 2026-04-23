# JoyScribe MVP Testing Plan

This is the fastest useful way to test the current MVP without overbuilding infrastructure too early.

## Recommended Test Stack

1. Use deterministic smoke checks for storage, prompt construction, and provider configuration.
2. Use manual browser workflow tests for recording, encounter switching, and purge behavior.
3. Use Ollama for local end-to-end note generation runs before spending on cloud providers.
4. Use archived "ideal" encounter chats and charting-assistant outputs as a gold set for regression review.

## What To Test First

### 1. Workflow Reliability

Run these every time we change the side panel workflow:

- Open the extension and verify one blank encounter is available on first load.
- Enter a patient label and context, close the panel, reopen it, and confirm the draft is restored.
- Create two encounters, switch back and forth, and confirm each draft restores the correct context, transcript, and note.
- Clear the active draft and confirm the label remains but context, transcript, and note are removed.
- Close an encounter and confirm its local draft is permanently removed from the encounter switcher.
- Start recording, hide the panel, and confirm recording stops safely with an actionable error.
- Record and stop with a configured provider, then confirm transcript and SOAP note populate the correct encounter.

### 2. Provider Coverage

For each supported provider, run one happy-path and one failure-path test:

- OpenAI
- Gemini
- Azure OpenAI
- Ollama

Failure cases to check:

- Missing API key or endpoint
- Invalid model name
- Offline network state for cloud providers
- Unreachable Ollama endpoint

### 3. Prompt Quality

Use archived ideal encounters as a simple regression set:

- Save 10 to 20 representative urgent care transcripts.
- Pair each transcript with a clinician-approved "ideal" SOAP note.
- Include a few context-heavy cases where the context field should materially change the note.
- Re-run the same set whenever system instructions or provider behavior changes.

Review each generated note for:

- Grounding: no invented diagnoses, vitals, meds, or tests
- Completeness: key symptoms, exam details, and plan elements captured when present
- Structure: exact `SUBJECTIVE`, `OBJECTIVE`, `ASSESSMENT`, `PLAN` headers
- Restraint: missing information marked as `Not documented`
- Edit burden: clinician should need light cleanup, not major rewriting

## Best Near-Term Setup

Ollama is the best first test target because it keeps the loop cheap and local:

- Start with one local model for daily smoke tests.
- Keep one cloud provider configured as a realism check.
- Use the same archived transcript set against both local and cloud runs to compare note quality and stability.

## Suggested Golden Dataset Shape

Aim for a small but varied set:

- Sore throat / URI
- Abdominal pain
- UTI symptoms
- Laceration follow-up
- Rash / allergic reaction
- Fever in child
- Chest pain sent to ED
- Work note / return-to-work visit
- Medication refill request
- Visit with sparse documentation where the model must avoid guessing

## Pass / Fail Criteria For MVP

Treat a build as MVP-acceptable if:

- Encounter switching never mixes drafts between patients.
- Closing an encounter always removes its stored local data.
- Note generation succeeds on most happy-path cases with the configured provider.
- The model follows SOAP formatting consistently.
- Archived gold-set runs do not show obvious hallucination regressions.

## What We Should Automate Next

Once the workflow feels stable, the first automation work should be:

1. Small unit tests around encounter storage normalization and prompt construction.
2. Fixture-based regression tests that feed transcripts plus context into the prompt builder.
3. A lightweight manual test checklist for provider setup and failure handling.
4. Optional golden-set scoring scripts once we have enough archived cases to justify it.
