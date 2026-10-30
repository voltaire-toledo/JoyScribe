# JoyScribe-UC

JoyScribe-UC is a Chrome Manifest V3 side-panel prototype for urgent care documentation. It records encounter audio in the browser, currently creates a mock transcript, and sends that transcript plus encounter context to a configured AI provider to draft an editable SOAP note.

Current status: prototype. It is not production-ready, not HIPAA-ready, and must not be used as the source of truth for clinical decisions.

## Current Implementation

- Chrome side panel extension defined in `manifest.json`.
- Toolbar icon opens `sidepanel/sidepanel.html` through the MV3 service worker in `background/background.js`.
- Microphone capture uses `MediaRecorder` in `services/audioService.js`.
- Transcription is mocked in `services/mockAiService.js`; recorded audio is not sent to a speech-to-text provider yet.
- SOAP note generation is real once an AI provider is configured.
- Supported note-generation providers are OpenAI and Google Gemini.
- Supported authentication choices are ChatGPT subscription, OpenAI API key, Gemini subscription, and Gemini API key. API-key modes are implemented today; subscription forwarding is selectable but blocked until the secure auth handoff is implemented.
- Provider settings, editable system instructions, theme, and open encounter drafts are stored locally in browser storage.
- Open encounter drafts include label, context, transcript, generated note, and timestamps.
- Closing an encounter removes that encounter's locally stored draft data.
- Copy-to-clipboard is the only export path.

## Repository Map

- `manifest.json`: Chrome extension manifest and permissions.
- `background/background.js`: side panel activation wiring.
- `sidepanel/sidepanel.html`: extension UI.
- `sidepanel/sidepanel.css`: side panel styles.
- `sidepanel/sidepanel.js`: UI state, settings, encounter workflow, and provider invocation.
- `services/audioService.js`: in-memory microphone recording.
- `services/mockAiService.js`: mock transcription.
- `services/aiConfigService.js`: provider settings and system prompt persistence.
- `services/aiProviderService.js`: provider-specific note generation calls.
- `services/encounterStorageService.js`: local open-encounter draft persistence.
- `assets/icons/joyscribe-logo.svg`: project logo asset.
- `PRD.md`: product requirements and roadmap.
- `TESTING.md`: manual and near-term automated test strategy.
- `TODO.md`: prioritized implementation backlog.
- `OPERATING_PROCEDURES.md`: development rules and standard operating procedures.

## Local Use

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer Mode.
3. Choose "Load unpacked".
4. Select `C:\Users\Jigs\CODE\VT-JoyScribe`.
5. Click the JoyScribe-UC extension icon to open the side panel.
6. Open settings and configure one provider.

Provider requirements:

- OpenAI API key: API key, model, and base URL. Default base URL is `https://api.openai.com/v1`.
- ChatGPT subscription: selectable as an auth mode, but note generation is blocked until a secure subscription forwarding flow exists.
- Gemini API key: API key and model. Default model is `gemini-2.5-flash`.
- Gemini subscription: selectable as an auth mode, but note generation is blocked until a secure subscription forwarding flow exists.

## Important Limitations

- Transcription is still mocked. The extension records real audio, but note generation receives a hard-coded sample urgent care transcript.
- Cloud provider requests may contain transcript and context text. Do not test with real PHI unless the provider, account, and architecture are explicitly approved for that use.
- API credentials are stored in Chrome extension local storage.
- Subscription-based ChatGPT and Gemini forwarding is not implemented yet.
- There is no production authentication, workspace management, audit logging, retention policy, EHR integration, or secure backend.
- There is no automated test suite in the repository yet.

## Development Rules

Use `OPERATING_PROCEDURES.md` as the required operating standard for future work. In short:

- Keep documentation in sync with behavior in the current checkout.
- Treat clinical safety and privacy as product requirements, not polish.
- Do not add real PHI handling until the architecture is explicitly approved.
- Do not persist audio.
- Keep provider integrations isolated in service modules.
- Update tests or the manual testing checklist when behavior changes.
