
import type { AssistantProvider, ChatMessage } from "./types";

const SUPABASE_URL = "https://mngenfsgilaqnjhvcpcx.supabase.co";

// Replace this with your real Supabase publishable key.
// Use the same key already configured in src/hooks/use-speech.ts.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_izPquXBCBR7IelPzE1MR5A_EJVyBiit";

const RESPONSE_INSTRUCTIONS = `Response accuracy and conciseness rules for FRIDAY AI:
- Keep every answer strictly under 100 words by default.
- Answer the user's actual question directly. Avoid unnecessary introductions, repetition, filler, and unrelated information.
- Accuracy first: provide correct, relevant, clear information. Never invent facts, sources, or capabilities, or pretend to know something uncertain. Acknowledge uncertainty and knowledge limitations, especially for current information you cannot verify.
- Expand beyond 100 words when the user explicitly requests more than 100 words, a detailed explanation, a tutorial, examples, or a comprehensive answer. Provide the requested level of detail.
- Match the question: simple questions get short answers; technical questions get concise but sufficient explanations; complex questions get more detail when requested.
- If essential information is missing, ask one clear follow-up question rather than guessing.
- Provide complete code, necessary steps, and requested formatting when needed, even if this requires exceeding 100 words. Do not truncate code or omit essential steps to meet the default limit.
- Answers are also spoken aloud: keep them natural and concise, avoiding unnecessarily long monologues while preserving requested detail and structured content.`;

export const FridayAIProvider: AssistantProvider = {
  name: "FRIDAY AI",
  isDemo: false,

  async reply(history: ChatMessage[], signal?: AbortSignal) {
    const conversation = history
      .filter(
        (message) =>
          (message.role === "user" || message.role === "assistant") &&
          message.text.trim().length > 0,
      )
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: message.text,
      }));
    const messages = [
      { role: "system", content: RESPONSE_INSTRUCTIONS },
      ...conversation,
    ];

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/friday-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages }),
        signal: signal ?? null,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "FRIDAY AI request failed.");
    }

    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("FRIDAY returned an empty reply.");
    }

    return data.reply.trim();
  },
};
