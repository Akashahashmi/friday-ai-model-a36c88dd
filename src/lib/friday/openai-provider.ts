
import type { AssistantProvider, ChatMessage } from "./types";

const SUPABASE_URL = "https://mngenfsgilaqnjhvcpcx.supabase.co";

// Replace this with your real Supabase publishable key.
// Use the same key already configured in src/hooks/use-speech.ts.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_izPquXBCBR7IelPzE1MR5A_EJVyBiit";

export const FridayAIProvider: AssistantProvider = {
  name: "FRIDAY AI",
  isDemo: false,

  async reply(history: ChatMessage[], signal?: AbortSignal) {
    const messages = history
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
        signal,
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
