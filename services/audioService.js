/**
 * services/audioService.js
 * Encapsulated microphone capture via MediaRecorder.
 * Data is kept in-memory and must be explicitly cleared by the caller.
 */

/**
 * @typedef {Object} RecordingResult
 * @property {Blob} audioBlob
 * @property {string} mimeType
 * @property {number} durationMs
 */

function pickSupportedMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export class AudioService {
  constructor() {
    /** @type {MediaStream|null} */
    this.mediaStream = null;

    /** @type {MediaRecorder|null} */
    this.mediaRecorder = null;

    /** @type {BlobPart[]} */
    this.chunks = [];

    /** @type {number|null} */
    this.startedAt = null;

    /** @type {string} */
    this.mimeType = "";
  }

  /**
   * Requests microphone permissions and starts recording.
   * @returns {Promise<void>}
   */
  async startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") return;

    this.mimeType = pickSupportedMimeType();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (error) {
      throw new Error("Microphone permission denied or unavailable.");
    }

    this.chunks = [];
    this.startedAt = performance.now();

    try {
      this.mediaRecorder = new MediaRecorder(
        this.mediaStream,
        this.mimeType ? { mimeType: this.mimeType } : undefined
      );
    } catch (error) {
      this.stopTracks();
      throw new Error("Failed to initialize recorder. Your browser may not support this format.");
    }

    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) this.chunks.push(event.data);
    });

    this.mediaRecorder.start();
  }

  /**
   * Stops recording and returns an in-memory Blob.
   * @returns {Promise<RecordingResult>}
   */
  async stopRecording() {
    if (!this.mediaRecorder) {
      throw new Error("No active recording to stop.");
    }
    if (this.mediaRecorder.state !== "recording") {
      throw new Error("Recorder is not currently recording.");
    }

    const recorder = this.mediaRecorder;

    const result = await new Promise((resolve, reject) => {
      recorder.addEventListener(
        "stop",
        () => {
          try {
            const endedAt = performance.now();
            const durationMs = this.startedAt ? Math.max(0, endedAt - this.startedAt) : 0;

            const blob = new Blob(this.chunks, {
              type: recorder.mimeType || this.mimeType || "audio/webm"
            });

            resolve({
              audioBlob: blob,
              mimeType: blob.type || "audio/webm",
              durationMs
            });
          } catch (e) {
            reject(new Error("Failed to finalize audio recording."));
          }
        },
        { once: true }
      );

      recorder.addEventListener(
        "error",
        () => reject(new Error("Recording failed unexpectedly.")),
        { once: true }
      );

      try {
        recorder.stop();
      } catch (e) {
        reject(new Error("Failed to stop recorder."));
      }
    });

    this.stopTracks();
    this.mediaRecorder = null;
    this.startedAt = null;

    return /** @type {RecordingResult} */ (result);
  }

  /**
   * Cancels recording (best-effort) and clears in-memory chunks.
   * @returns {void}
   */
  cancelAndClear() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      }
    } catch {
      // ignore
    }

    this.stopTracks();
    this.mediaRecorder = null;
    this.chunks = [];
    this.startedAt = null;
    this.mimeType = "";
  }

  stopTracks() {
    if (!this.mediaStream) return;
    for (const track of this.mediaStream.getTracks()) track.stop();
    this.mediaStream = null;
  }
}