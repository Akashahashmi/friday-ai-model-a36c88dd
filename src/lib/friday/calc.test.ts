import { describe, it, expect } from "vitest";
import { evaluateExpression } from "./calc";

describe("evaluateExpression", () => {
  it("respects precedence", () => expect(evaluateExpression("2+3*4")).toBe(14));
  it("handles parentheses", () => expect(evaluateExpression("(2+3)*4")).toBe(20));
  it("rejects non-math input", () => expect(evaluateExpression("alert(1)")).toBeNull());
  it("rejects division by zero", () => expect(evaluateExpression("1/0")).toBeNull());
});
