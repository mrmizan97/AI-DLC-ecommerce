"use client";

// VoiceSearchButton
// -----------------
// A small mic button you drop next to a text input. It captures speech and
// calls `onText(transcribed)` so the parent can decide what to do with it
// (we wire it to the search bar and auto-submit on completion).
//
// Two paths, picked at runtime:
//
//   1. PRIMARY — browser-native Web Speech API (window.SpeechRecognition or
//      webkitSpeechRecognition). Real-time partial results, on-device, free,
//      no network roundtrip. Supported in Chrome, Edge, Safari (mobile/web).
//
//   2. FALLBACK — MediaRecorder records a short clip, POSTs it to
//      /api/voice/transcribe (which uses Whisper or a stub). Works in any
//      browser with getUserMedia, at the cost of one server roundtrip.
//
// We try (1) first because it's strictly better; fall back to (2) only when
// the browser doesn't expose the SpeechRecognition object.
//
// Visual states:
//   idle        — gray mic
//   listening   — red mic, pulsing
//   processing  — spinner (only in fallback path while we wait on the server)
//   denied      — gray mic with a tooltip ("microphone blocked")

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import api from "@/lib/api";

const MAX_FALLBACK_MS = 8000; // hard stop for the recording fallback

export default function VoiceSearchButton({ onText, onListening, className = "" }) {
  const [state, setState] = useState("idle"); // idle | listening | processing | denied | unsupported
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const stopTimerRef = useRef(null);

  // Tell parent on state changes (so it can disable the input or show a hint).
  useEffect(() => {
    onListening?.(state === "listening" || state === "processing");
  }, [state, onListening]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      try { mediaRecorderRef.current?.stop(); } catch {}
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const hasWebSpeech =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // ── Path 1: Web Speech API (preferred) ───────────────────────────────
  const startWebSpeech = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    let lastTranscript = "";
    recognition.onresult = (event) => {
      // Concatenate all results — Web Speech delivers them as you speak.
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
      }
      lastTranscript = combined.trim();
      // Live preview: tell parent on every interim result.
      onText?.(lastTranscript, { final: event.results[event.results.length - 1].isFinal });
    };
    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setState("denied");
      else setState("idle");
    };
    recognition.onend = () => {
      setState("idle");
      // Final commit so the parent can auto-submit even if no `isFinal` arrived.
      if (lastTranscript) onText?.(lastTranscript, { final: true });
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setState("listening");
    } catch {
      setState("idle");
    }
  };

  // ── Path 2: MediaRecorder fallback ───────────────────────────────────
  const startFallback = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("denied");
      return;
    }
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setState("processing");
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      try {
        const form = new FormData();
        form.append("audio", blob, "voice-search.webm");
        const res = await api.post("/voice/transcribe", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const text = (res.data?.text || "").trim();
        if (text) onText?.(text, { final: true, model: res.data?.model });
      } catch (err) {
        console.error("[voice] fallback transcription failed:", err.message);
      } finally {
        setState("idle");
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setState("listening");
    // hard stop so we never record more than MAX_FALLBACK_MS
    stopTimerRef.current = setTimeout(() => { try { recorder.stop(); } catch {} }, MAX_FALLBACK_MS);
  };

  const start = () => {
    if (state !== "idle") return;
    if (hasWebSpeech) startWebSpeech();
    else startFallback();
  };

  const stop = () => {
    try { recognitionRef.current?.stop(); } catch {}
    try { mediaRecorderRef.current?.stop(); } catch {}
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
  };

  // ── UI ───────────────────────────────────────────────────────────────
  const tooltip =
    state === "denied"
      ? "Microphone blocked — allow it in your browser settings"
      : state === "unsupported"
      ? "Voice not supported in this browser"
      : state === "listening"
      ? "Listening — click to stop"
      : state === "processing"
      ? "Transcribing…"
      : hasWebSpeech ? "Voice search" : "Voice search (server fallback)";

  const Icon = state === "processing" ? Loader2 : state === "denied" || state === "unsupported" ? MicOff : Mic;
  const ringClass =
    state === "listening" ? "ring-2 ring-red-500 animate-pulse text-red-600 bg-red-50"
    : state === "processing" ? "text-amber-600 bg-amber-50"
    : state === "denied" || state === "unsupported" ? "text-gray-400 cursor-not-allowed"
    : "text-gray-700 hover:bg-gray-100";

  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={state === "listening"}
      onClick={state === "listening" ? stop : start}
      disabled={state === "denied" || state === "unsupported" || state === "processing"}
      className={`px-3 flex items-center justify-center transition-colors ${ringClass} ${className}`}
    >
      <Icon size={18} className={state === "processing" ? "animate-spin" : ""} />
    </button>
  );
}
