/** Shared AudioContext, unlocked on the first user gesture (browser autoplay rules). */
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    ctx ??= new Ctx();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // Audio is unavailable in this browser.
  }
}

/** Two-tone reminder chime. Resumes a suspended context before attempting playback. */
export async function playChime(): Promise<boolean> {
  try {
    if (!ctx) unlockAudio();
    if (!ctx) return false;
    if (ctx.state === "suspended") await ctx.resume();
    if (ctx.state !== "running") return false;

    const audioContext = ctx;
    const t = audioContext.currentTime;
    [880, 1320].forEach((f, i) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = f;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.0001, t + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.25, t + i * 0.22 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.5);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(t + i * 0.22);
      oscillator.stop(t + i * 0.22 + 0.55);
    });
    return true;
  } catch {
    return false;
  }
}
