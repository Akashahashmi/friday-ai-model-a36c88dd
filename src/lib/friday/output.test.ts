import { describe, it, expect } from "vitest";
import { formatAssistantText, toSpeechText } from "./output";

describe("separate assistant outputs", () => {
  it("preserves a normal greeting", () => {
    expect(toSpeechText("Hello Akasha, how can I help you today?")).toBe("Hello Akasha, how can I help you today?");
  });
  it("keeps bold Markdown in chat and speaks a percentage", () => {
    expect(formatAssistantText("Your result is **95%**.")).toBe("Your result is **95%**.");
    expect(toSpeechText("Your result is **95%**.")).toBe("Your result is 95 percent.");
  });
  it("removes heading syntax only for speech", () => {
    expect(toSpeechText("### Today's summary")).toBe("Today's summary");
  });
  it("preserves and speaks Pythagorean notation", () => {
    expect(formatAssistantText("x² + y² = z²")).toBe("x² + y² = z²");
    expect(toSpeechText("x² + y² = z²")).toBe("x squared plus y squared equals z squared");
  });
  it("keeps code structure and symbols intact", () => {
    const code = 'int main() { printf("[excited] 95% & x"); return 0; }';
    expect(formatAssistantText('```c\n' + code + '\n```')).toBe('```c\n' + code + '\n```');
    expect(toSpeechText('```c\n' + code + '\n```')).toBe('Code: ' + code);
  });
  it("hides known performance cues but keeps Markdown links", () => {
    expect(formatAssistantText("[excited] Hello everyone!")).toBe("Hello everyone!");
    expect(toSpeechText("[excited] Hello everyone!")).toBe("Hello everyone!");
    expect(formatAssistantText("[thoughtful](https://example.com)")).toBe("[thoughtful](https://example.com)");
  });
  it("speaks ampersands, division, equality, and currency naturally", () => {
    expect(toSpeechText("A & B, 10/2 = 5, and the total is $50.")).toBe("A and B, 10 divided by 2 equals 5, and the total is 50 dollars.");
  });
  it("keeps technical destinations and meaningful emojis", () => {
    const input = "See https://example.com/a+b?q=95% or a+b@example.com 😊";
    expect(toSpeechText(input)).toBe(input);
  });
  it("speaks powers and inequalities", () => {
    expect(toSpeechText("x^4 ≤ 16")).toBe("x to the power of 4 less than or equal to 16");
  });
  it("removes limited artifacts, not technical punctuation", () => {
    expect(formatAssistantText("Wow!!!!\uFFFD\n✦✦✦\nC++ costs $50... 😊")).toBe("Wow!\n\nC++ costs $50... 😊");
  });
  it("handles stage-only text as empty speech", () => {
    expect(toSpeechText("[dramatic pause]")).toBe("");
  });
});