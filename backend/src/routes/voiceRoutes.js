// /api/voice — server-side speech-to-text for the global search bar.
//
// The frontend tries the browser's Web Speech API first; if it's not
// supported (or the user disables it), it records a short clip with
// MediaRecorder and POSTs the blob here.
//
//   POST /api/voice/transcribe
//     multipart/form-data with field "audio"
//     returns { text, model, durationMs }
//
// No auth: search is public, so voice-to-search is too. Add authenticate
// here if you start using this endpoint for anything role-gated.

const express = require("express");
const multer = require("multer");
const { transcribe } = require("../lib/ai/transcribe");

const router = express.Router();

// 25MB cap matches OpenAI Whisper's limit; rejects bigger uploads cheaply.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "audio file is required (multipart field 'audio')" });
    }
    const result = await transcribe({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      filename: req.file.originalname || "audio.webm",
    });
    res.json(result);
  } catch (err) {
    console.error("[voice/transcribe] failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
