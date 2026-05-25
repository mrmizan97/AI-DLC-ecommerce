// Speech-to-text provider abstraction.
//
// Why this exists: the frontend's primary path is the browser's Web Speech
// API (free, real-time, on-device). This server endpoint is the FALLBACK
// for browsers that don't support it (Firefox without flags, some mobile)
// — and the place where a real, accurate STT model lives for use cases
// where browser STT isn't enough.
//
// Provider order:
//   1. OpenAI Whisper API   — if OPENAI_API_KEY is set (recommended in prod)
//   2. Deterministic stub   — used in dev/test and when no key is configured
//
// The stub returns a fixed string so the route still has a predictable
// contract for tests and demos. Swap in any provider by extending the
// switch in transcribe().

const FALLBACK_MODEL = "stub-transcribe-v1";
const WHISPER_MODEL = "whisper-1";

async function transcribe({ buffer, mimeType = "audio/webm", filename = "audio.webm" }) {
  if (!buffer || buffer.length === 0) {
    return { text: "", model: FALLBACK_MODEL, error: "empty audio" };
  }
  if (process.env.OPENAI_API_KEY) {
    return transcribeWhisper({ buffer, mimeType, filename });
  }
  return transcribeStub({ buffer });
}

async function transcribeWhisper({ buffer, mimeType, filename }) {
  // multipart/form-data POST. Whisper accepts mp3/mp4/mpeg/mpga/m4a/wav/webm.
  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  form.append("file", blob, filename);
  form.append("model", WHISPER_MODEL);

  const start = Date.now();
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Whisper API ${res.status}: ${text}`);
  }
  const data = await res.json();
  return {
    text: (data.text || "").trim(),
    model: WHISPER_MODEL,
    durationMs: Date.now() - start,
  };
}

// Deterministic stub: returns a fixed string so tests and the demo flow
// produce a useful result without needing an API key. Comment in the
// front-end shows the user "demo mode" when the model is `stub-*`.
function transcribeStub({ buffer }) {
  return {
    text: "demo mode — voice search is wired up but no real STT provider is configured",
    model: FALLBACK_MODEL,
    durationMs: 0,
    bytesReceived: buffer.length,
  };
}

module.exports = { transcribe, FALLBACK_MODEL, WHISPER_MODEL };
