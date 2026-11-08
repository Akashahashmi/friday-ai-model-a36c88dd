import { afterEach, describe, expect, it, vi } from "vitest";
import { FridayAIProvider } from "./openai-provider";
import type { ChatMessage } from "./types";

afterEach(() => vi.unstubAllGlobals());

async function sentMessages() {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: "Answer" }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const history: ChatMessage[] = Array.from({ length: 25 }, (_, i) => ({
    id: String(i), role: i % 2 ? "assistant" : "user", text: `Turn ${i}`, at: i,
  }));
  await FridayAIProvider.reply(history);
  const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
  return JSON.parse(String(options.body)).messages as { role: string; content: string }[];
}

describe("FRIDAY response instructions", () => {
  it("always sends the under-100-word default as a system instruction", async () => {
    const messages = await sentMessages();
    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("strictly under 100 words by default");
  });
  it("instructs direct answers without filler", async () => {
    expect((await sentMessages())[0]?.content).toContain("Answer the user's actual question directly");
  });
  it("prohibits invented facts and false certainty", async () => {
    expect((await sentMessages())[0]?.content).toContain("Never invent facts, sources, or capabilities, or pretend to know something uncertain");
  });
  it("allows explicitly requested detailed explanations and examples", async () => {
    expect((await sentMessages())[0]?.content).toContain("Expand beyond 100 words when the user explicitly requests");
  });
  it("matches simple and technical questions", async () => {
    expect((await sentMessages())[0]?.content).toContain("simple questions get short answers; technical questions get concise but sufficient explanations");
  });
  it("asks one question when essential information is missing", async () => {
    expect((await sentMessages())[0]?.content).toContain("ask one clear follow-up question rather than guessing");
  });
  it("allows complete code and necessary steps beyond the default limit", async () => {
    expect((await sentMessages())[0]?.content).toContain("Provide complete code, necessary steps, and requested formatting when needed, even if this requires exceeding 100 words");
  });
  it("keeps spoken answers natural and concise", async () => {
    expect((await sentMessages())[0]?.content).toContain("keep them natural and concise, avoiding unnecessarily long monologues");
  });
  it("preserves the latest 20 conversation turns after the instructions", async () => {
    const messages = await sentMessages();
    expect(messages).toHaveLength(21);
    expect(messages[1]).toEqual({ role: "assistant", content: "Turn 5" });
    expect(messages[20]).toEqual({ role: "user", content: "Turn 24" });
  });
});