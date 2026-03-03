/**
 * services/mockAiService.js
 * Mock STT + LLM pipeline using setTimeout to simulate network + processing.
 * IMPORTANT: No persistence. Caller owns lifecycle and must clear data.
 */

/**
 * @typedef {Object} MockAiResult
 * @property {string} transcript
 * @property {string} soapNoteText
 */

/**
 * Creates a standardized urgent care SOAP note (mock output).
 * @param {string} transcript
 * @returns {string}
 */
function buildSoapNote(transcript) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  return `DATE: ${dateStr}

SUBJECTIVE
- Chief Complaint: Sore throat and fever x 2 days.
- HPI: Patient reports acute onset sore throat with subjective fever, fatigue, and mild headache. Denies chest pain, shortness of breath, or difficulty swallowing liquids. No known sick contacts. OTC acetaminophen with partial relief.
- ROS (focused):
  - Constitutional: +fever, +fatigue
  - HEENT: +sore throat, -ear pain
  - Respiratory: -cough, -dyspnea
  - GI: -nausea, -vomiting

OBJECTIVE
- Vitals: T 100.8°F, HR 96, BP 122/78, RR 16, SpO2 99% RA
- General: Alert, non-toxic.
- HEENT: Oropharyngeal erythema, mild tonsillar hypertrophy, no peritonsillar abscess, uvula midline.
- Neck: Tender anterior cervical lymphadenopathy.
- Lungs: Clear to auscultation bilaterally.
- Diagnostics: Rapid strep pending / not performed (mock).

ASSESSMENT
1. Acute pharyngitis (viral vs streptococcal).
2. Fever.

PLAN
- Testing: Consider rapid strep +/- culture if indicated by Centor criteria.
- Treatment:
  - Supportive care: hydration, warm salt water gargles, throat lozenges.
  - Analgesics/antipyretics: acetaminophen or ibuprofen as directed.
- Counseling: Return precautions for worsening symptoms, trouble breathing, inability to tolerate PO, drooling, neck stiffness, or persistent fever.
- Follow-up: PCP in 2–3 days or sooner if worse.

TRANSCRIPT (mock)
${transcript}
`;
}

/**
 * Mock end-to-end: "audio blob" -> transcript -> SOAP note.
 * @param {Blob} audioBlob
 * @param {{ durationMs?: number }} [meta]
 * @returns {Promise<MockAiResult>}
 */
export async function mockGenerateSoapNoteFromAudio(audioBlob, meta = {}) {
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

  // Simulate LLM delay
  await new Promise((r) => setTimeout(r, 900));

  return {
    transcript,
    soapNoteText: buildSoapNote(transcript)
  };
}