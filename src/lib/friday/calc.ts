/** Safe arithmetic evaluator (no eval). Supports + - * / % ^ and parentheses. */
export function evaluateExpression(src: string): number | null {
  const tokens = src.replace(/\s+/g, "").match(/\d*\.?\d+|[+\-*/%^()]/g);
  if (!tokens || tokens.join("") !== src.replace(/\s+/g, "")) return null;
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  function primary(): number {
    const t = next();
    if (t === "(") { const v = expr(); if (next() !== ")") throw 0; return v; }
    if (t === "-") return -primary();
    if (t === "+") return primary();
    const n = Number(t);
    if (Number.isNaN(n)) throw 0;
    return n;
  }
  function power(): number { const b = primary(); if (peek() === "^") { next(); return b ** power(); } return b; }
  function term(): number {
    let v = power();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = next(); const r = power();
      v = op === "*" ? v * r : op === "/" ? v / r : v % r;
    }
    return v;
  }
  function expr(): number {
    let v = term();
    while (peek() === "+" || peek() === "-") { const op = next(); const r = term(); v = op === "+" ? v + r : v - r; }
    return v;
  }
  try {
    const v = expr();
    if (i !== tokens.length || !Number.isFinite(v)) return null;
    return Math.round(v * 1e10) / 1e10;
  } catch {
    return null;
  }
}
