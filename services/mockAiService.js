/**
 * services/mockAiService.js
 * Mock STT + LLM pipeline using setTimeout to simulate network + processing.
 * IMPORTANT: No persistence. Caller owns lifecycle and must clear data.
 */

/**
 * @typedef {Object} MockTranscriptResult
 * @property {string} transcript
 */

/**
 * Mock audio transcription.
 * @param {Blob} audioBlob
 * @param {{ durationMs?: number }} [meta]
 * @returns {Promise<MockTranscriptResult>}
 */
export async function mockTranscribeAudio(audioBlob, meta = {}) {
  // Touch the blob to emulate validation without storing.
  const sizeKb = Math.round((audioBlob?.size || 0) / 1024);
  const seconds = meta.durationMs ? Math.round(meta.durationMs / 1000) : null;

  const transcript = `Provider: Hi, what brings you in today?
Patient: I've had a sore throat and fever for two days.
Provider: Any cough or shortness of breath?
Patient: No cough, breathing is fine.
Provider: Any nausea or vomiting?
Patient: No.
Provider: We'll take a look and decide if you need a strep test.

(meta: audio ~${sizeKb}KB${seconds != null ? `, ${seconds}s` : ""})`;

  // Simulate STT delay
  await new Promise((r) => setTimeout(r, 700));

  return {
    transcript
  };
}
