let audioCtx = null;
let activeTimers = [];

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playBeep(frequency = 880, duration = 0.25, volume = 0.2) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function stopNotificationSound() {
  activeTimers.forEach((id) => clearInterval(id));
  activeTimers = [];
}

export function playNotificationSound({ durationMs = 5000, intervalMs = 700, frequency = 880 } = {}) {
  stopNotificationSound();
  playBeep(frequency);
  const id = setInterval(() => playBeep(frequency), intervalMs);
  activeTimers.push(id);
  setTimeout(() => {
    clearInterval(id);
    activeTimers = activeTimers.filter((x) => x !== id);
  }, durationMs);
}
