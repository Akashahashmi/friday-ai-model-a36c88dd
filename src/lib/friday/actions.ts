/** Allowlisted actions FRIDAY can perform in the browser. Desktop actions could be added by a future companion app. */
export type Intent =
  | { kind: "open"; site: "google" | "youtube"; url: string }
  | { kind: "search"; query: string; url: string }
  | { kind: "calculator" }
  | { kind: "time" }
  | { kind: "date" }
  | { kind: "clear" }
  | { kind: "joke" }
  | { kind: "stop" }
  | { kind: "mute" }
  | { kind: "unmute" }
  | { kind: "repeat" }
  | { kind: "desktop" };

export const SITES = { google: "https://www.google.com/", youtube: "https://www.youtube.com/" } as const;

export const googleSearchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export const JOKES = [
  "I told my processor a joke about recursion. It told me the same joke about recursion.",
  "Why did the robot go on vacation? It needed to recharge its batteries, boss.",
  "There are ten kinds of people: those who understand binary, and those who don't.",
  "I'd tell you a UDP joke, but you might not get it.",
];

export function parseIntent(input: string): Intent | null {
  const q = input.toLowerCase().trim().replace(/[.!?]+$/, "");
  const search = q.match(/^(?:please\s+)?(?:search|google)(?:\s+google)?(?:\s+for)?\s+(.+)$/);
  if (search && search[1] !== "google") return { kind: "search", query: search[1], url: googleSearchUrl(search[1]) };
  if (/\b(open|launch|go to)\b.*\byoutube\b/.test(q)) return { kind: "open", site: "youtube", url: SITES.youtube };
  if (/\b(open|launch|go to)\b.*\bgoogle\b/.test(q)) return { kind: "open", site: "google", url: SITES.google };
  if (/\b(open|launch|start)\b.*\b(notepad|word|excel|settings|chrome|file explorer|spotify|windows)\b/.test(q)) return { kind: "desktop" };
  if (/\bcalculator\b/.test(q)) return { kind: "calculator" };
  if (/\bwhat('s| is)? (the )?time\b|\bwhat time\b/.test(q)) return { kind: "time" };
  if (/\b(what('s| is)? (the )?date|what day is it)\b/.test(q)) return { kind: "date" };
  if (/\bclear\b.*\b(conversation|chat|history)\b/.test(q)) return { kind: "clear" };
  if (/\bjoke\b/.test(q)) return { kind: "joke" };
  if (/^(stop|stop speaking|stop talking|be quiet|shut up)$/.test(q)) return { kind: "stop" };
  if (/\bunmute\b/.test(q)) return { kind: "unmute" };
  if (/\bmute\b/.test(q)) return { kind: "mute" };
  if (/\b(repeat that|say that again|repeat)\b/.test(q)) return { kind: "repeat" };
  return null;
}
