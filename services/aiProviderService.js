import {
  PROVIDERS,
  getActiveProviderConfig,
  normalizeAiSettings
} from "./aiConfigService.js";

/**
 * services/aiProviderService.js
 * Calls the configured model provider to turn a transcript into a SOAP note.
 */

const NOTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    soapNoteText: {
      type: "string",
      description:
        "A plain-text urgent care SOAP note with the section headers SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN."
    }
  },
  required: ["soapNoteText"]
};

function buildUserPrompt(transcript, meta = {}) {
  const durationLine = meta.durationMs
    ? `Recording duration: ${Math.max(1, Math.round(meta.durationMs / 1000))} seconds`
    : "Recording duration: unknown";
  const encounterContext = typeof meta.encounterContext === "string" && meta.encounterContext.trim()
    ? meta.encounterContext.trim()
    : "None provided";

  return `Create a clinician-editable urgent care SOAP note from the transcript below.

Return a plain-text note. Keep the section headers exactly as:
SUBJECTIVE
OBJECTIVE
ASSESSMENT
PLAN

If clinically important information is missing, state "Not documented" instead of guessing.

Encounter metadata:
- ${durationLine}
- Encounter context: ${encounterContext}

Encounter transcript:
${transcript}`;
}

function stripCodeFences(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseStructuredJson(text) {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch (error) {
    throw new Error("The selected model returned invalid JSON.");
  }
}

function extractOpenAiText(responseJson) {
  if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }

  const parts = [];
  for (const outputItem of responseJson?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if (typeof contentItem?.text === "string") {
        parts.push(contentItem.text);
      }
    }
  }

  if (parts.length > 0) {
    return parts.join("\n").trim();
  }

  throw new Error("The provider returned no usable response text.");
}

function extractGeminiText(responseJson) {
  if (typeof responseJson?.text === "string" && responseJson.text.trim()) {
    return responseJson.text;
  }

  const parts = [];
  for (const candidate of responseJson?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      if (typeof part?.text === "string") {
        parts.push(part.text);
      }
    }
  }

  if (parts.length > 0) {
    return parts.join("\n").trim();
  }

  throw new Error("Gemini returned no usable response text.");
}

function extractOllamaText(responseJson) {
  if (typeof responseJson?.message?.content === "string") {
    return responseJson.message.content.trim();
  }

  if (typeof responseJson?.response === "string") {
    return responseJson.response.trim();
  }

  throw new Error("Ollama returned no usable response text.");
}

async function parseErrorResponse(response) {
  try {
    const json = await response.json();
    const message =
      json?.error?.message ||
      json?.message ||
      json?.detail ||
      json?.error ||
      null;
    return typeof message === "string" && message.trim() ? message.trim() : null;
  } catch {
    return null;
  }
}

async function postJson(url, options) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error("Network request failed. Check connectivity and provider endpoint settings.");
  }

  if (!response.ok) {
    const providerMessage = await parseErrorResponse(response);
    throw new Error(providerMessage || `Provider request failed with status ${response.status}.`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Provider returned invalid JSON.");
  }
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function normalizeAzureBaseUrl(endpoint) {
  const trimmed = normalizeBaseUrl(endpoint.trim());

  if (trimmed.endsWith("/openai/v1")) return trimmed;
  if (trimmed.endsWith("/openai")) return `${trimmed}/v1`;

  return `${trimmed}/openai/v1`;
}

async function generateWithOpenAiLikeProvider({ baseUrl, apiKey, model, systemPrompt, userPrompt }) {
  const payload = {
    model,
    instructions: systemPrompt,
    input: userPrompt,
    store: false,
    temperature: 0.2,
    text: {
      format: {
        type: "json_schema",
        name: "joyscribe_note",
        strict: true,
        schema: NOTE_SCHEMA
      }
    }
  };

  const responseJson = await postJson(`${normalizeBaseUrl(baseUrl)}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  return parseStructuredJson(extractOpenAiText(responseJson));
}

async function generateWithAzure({ config, systemPrompt, userPrompt }) {
  const payload = {
    model: config.model,
    instructions: systemPrompt,
    input: userPrompt,
    store: false,
    temperature: 0.2,
    text: {
      format: {
        type: "json_schema",
        name: "joyscribe_note",
        strict: true,
        schema: NOTE_SCHEMA
      }
    }
  };

  const responseJson = await postJson(`${normalizeAzureBaseUrl(config.endpoint)}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey
    },
    body: JSON.stringify(payload)
  });

  return parseStructuredJson(extractOpenAiText(responseJson));
}

async function generateWithGemini({ config, systemPrompt, userPrompt }) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}` +
    `:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseJsonSchema: NOTE_SCHEMA
    }
  };

  const responseJson = await postJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseStructuredJson(extractGeminiText(responseJson));
}

async function generateWithOllama({ config, systemPrompt, userPrompt }) {
  const payload = {
    model: config.model,
    stream: false,
    format: NOTE_SCHEMA,
    options: {
      temperature: 0.2
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  const responseJson = await postJson(`${normalizeBaseUrl(config.endpoint)}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseStructuredJson(extractOllamaText(responseJson));
}

export async function generateSoapNoteFromTranscript({ transcript, meta = {}, settings }) {
  const normalizedSettings = normalizeAiSettings(settings);
  const activeConfig = getActiveProviderConfig(normalizedSettings);
  const systemPrompt = normalizedSettings.systemPrompt || "";
  const userPrompt = buildUserPrompt(transcript, meta);

  let result;

  if (normalizedSettings.provider === PROVIDERS.openai) {
    result = await generateWithOpenAiLikeProvider({
      baseUrl: activeConfig.baseUrl,
      apiKey: activeConfig.apiKey,
      model: activeConfig.model,
      systemPrompt,
      userPrompt
    });
  } else if (normalizedSettings.provider === PROVIDERS.gemini) {
    result = await generateWithGemini({
      config: activeConfig,
      systemPrompt,
      userPrompt
    });
  } else if (normalizedSettings.provider === PROVIDERS.azure) {
    result = await generateWithAzure({
      config: activeConfig,
      systemPrompt,
      userPrompt
    });
  } else if (normalizedSettings.provider === PROVIDERS.ollama) {
    result = await generateWithOllama({
      config: activeConfig,
      systemPrompt,
      userPrompt
    });
  } else {
    throw new Error("Unsupported provider selected.");
  }

  const soapNoteText =
    typeof result?.soapNoteText === "string" ? result.soapNoteText.trim() : "";

  if (!soapNoteText) {
    throw new Error("The selected model returned an empty SOAP note.");
  }

  return {
    soapNoteText
  };
}
