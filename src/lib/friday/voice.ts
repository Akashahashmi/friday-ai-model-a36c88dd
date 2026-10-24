/** Central voice settings. Swap provider here later (e.g. a server-side TTS service). */
export const VOICE = {
  provider: "browser" as const,
  pitch: 0.55, // deeper
  rateFactor: 0.9, // slightly slower, measured delivery
  preferred: ["Daniel", "George", "Google UK English Male", "Microsoft Guy", "Microsoft David", "Alex", "Fred", "Male"],
};

export function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (!voices.length) return null;
  for (const name of VOICE.preferred) {
    const v = voices.find((x) => x.name.includes(name) && x.lang.startsWith("en"));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}
