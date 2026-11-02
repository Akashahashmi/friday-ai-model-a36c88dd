/** Shared AudioContext, unlocked on the first user gesture (browser autoplay rules). */
let ctx: AudioContext | null = null;
export function unlockAudio() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    ctx ??= new Ctx();
    if (ctx.state === "suspended") void ctx.resume();
  } catch { /* no audio */ }
}
/** Two-tone reminder chime. Returns false if audio is still locked by the browser. */
export function playChime(): boolean {
  if (!ctx || ctx.state !== "running") return false;
  const t = ctx.currentTime;
  [880, 1320].forEach((f, i) => {
    const o = ctx!.createOscillator(); const g = ctx!.createGain();
    o.frequency.value = f; o.type = "sine";
    g.gain.setValueAtTime(0.0001, t + i * 0.22);
    g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.22 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.5);
    o.connect(g).connect(ctx!.destination); o.start(t + i * 0.22); o.stop(t + i * 0.22 + 0.55);
  });
  return true;
}
