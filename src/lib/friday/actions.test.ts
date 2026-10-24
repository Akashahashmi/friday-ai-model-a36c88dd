import { describe, expect, it } from "vitest";
import { parseIntent } from "./actions";

describe("parseIntent", () => {
  it("opens youtube", () => expect(parseIntent("Open YouTube")).toMatchObject({ kind: "open", url: "https://www.youtube.com/" }));
  it("opens google", () => expect(parseIntent("open google")).toMatchObject({ kind: "open", url: "https://www.google.com/" }));
  it("encodes google searches", () =>
    expect(parseIntent("Search Google for matrix eigenvalues")).toMatchObject({ kind: "search", url: "https://www.google.com/search?q=matrix%20eigenvalues" }));
  it("refuses desktop apps honestly", () => expect(parseIntent("open notepad")).toEqual({ kind: "desktop" }));
  it("unmute is not mute", () => expect(parseIntent("unmute yourself")).toEqual({ kind: "unmute" }));
  it("unknown returns null", () => expect(parseIntent("explain photosynthesis")).toBeNull());
});
