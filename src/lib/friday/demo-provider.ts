import type { AssistantProvider } from "./types";
import { evaluateExpression } from "./calc";

function respond(input: string): string {
  const q = input.toLowerCase().trim();
  if (/^(hi|hello|hey)\b/.test(q)) return "Hello. I'm FRIDAY, running in demo mode. Try asking the time, or a calculation like 12 * 7.";
  if (q.includes("time")) return `It's ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
  if (q.includes("date") || q.includes("today")) return `Today is ${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`;
  if (q.includes("who are you") || q.includes("your name")) return "I'm FRIDAY, a prototype assistant interface. No AI model is connected yet, so my answers are scripted.";
  const math = q.replace(/^(what is|calculate|compute)\s*/, "").replace(/\?$/, "");
  if (/^[\d\s+\-*/().%^]+$/.test(math) && /\d/.test(math)) {
    const r = evaluateExpression(math);
    if (r !== null) return `${math.trim()} = ${r}`;
  }
  return "I'm in demo mode, so I can't answer that yet. Once an AI model is connected, I'll be able to help with open-ended questions.";
}

export const DemoProvider: AssistantProvider = {
  name: "Demo (scripted)",
  isDemo: true,
  reply(history, signal) {
    const last = [...history].reverse().find((m) => m.role === "user");
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => resolve(respond(last?.text ?? "")), 700 + Math.random() * 600);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  },
};
