# JoyScribe-UC

Chrome side-panel extension for drafting urgent care SOAP notes from recorded encounter audio.

See [TESTING.md](/Users/me/CODE/gh-me/JoyScribe/TESTING.md) for the recommended MVP test strategy.

## Requirements

To use the extension in its current state, the client needs:

- Google Chrome 114 or newer.
- The ability to load an unpacked Chrome extension locally.
- A working microphone and permission to grant Chrome microphone access.
- One configured AI provider for note generation:
  - OpenAI: API key and model name.
  - Google Gemini: API key and model name.
  - Azure OpenAI: Azure endpoint, API key, and deployment name.
  - Ollama: a reachable local Ollama server and model name.
- Network access for cloud providers:
  - OpenAI calls `https://api.openai.com`.
  - Gemini calls `https://generativelanguage.googleapis.com`.
  - Azure OpenAI calls the clinic's Azure OpenAI endpoint.
- Local network access for Ollama:
  - By default the extension expects Ollama at `http://127.0.0.1:11434`.
- Permission for the extension to use Chrome local storage:
  - Provider settings, editable system instructions, and open encounter drafts are stored locally in extension storage until the clinician closes the encounter.

## Current Limitations

- Audio transcription is still mocked. The extension records real audio, but it does not yet send audio to a real STT provider.
- SOAP note generation is real once a provider is configured.
- Encounter label, context, transcript, and note draft are stored locally so clinicians can switch between patients during the day.
- Closing an encounter purges its locally stored draft data.
- Notes may be sent to the selected provider, so clients should choose a provider consistent with their privacy and compliance requirements.
- This is a prototype and should not be relied on for clinical decision-making.
