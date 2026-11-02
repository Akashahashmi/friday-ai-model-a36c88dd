/** Reminder parsing + storage helpers. Browser-only: reminders fire only while FRIDAY is open in a tab. */

export type Reminder = {
  id: string;
  task: string;
  dueAt: number; // epoch ms
  done: boolean;
  notified: boolean;
  createdAt: number;
  repeat?: "daily";
};

export type ReminderRequest =
  | { kind: "set"; task: string; dueAt: number; repeat?: "daily" }
  | { kind: "unclear"; task: string | null } // has a reminder intent but no usable time
  | { kind: "list" }
  | { kind: "cancel"; task: string };

const TIME_RE = /(?:\bat\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const TIME_24H_RE = /(?:\bat\s+)?\b(\d{1,2}):(\d{2})\b/;
const REL_RE = /\b(?:in|after|for)\s+(\d+|an?|one)\s*(minutes?|mins?|hours?|hrs?)(?:\s+from\s+now)?\b/;

function resolveDue(day: "today" | "tomorrow", h: number, min: number, now: Date): number {
  const d = new Date(now);
  d.setHours(h, min, 0, 0);
  if (day === "tomorrow") d.setDate(d.getDate() + 1);
  // A time today that already passed almost certainly means the next occurrence.
  else if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Parse a reminder command. Returns null when the message is not about reminders. */
export function parseReminder(input: string, now: Date = new Date()): ReminderRequest | null {
  const q = input.toLowerCase().trim().replace(/[.!?]+$/, "");

  if (/\b(cancel|delete|remove)\b.*\breminder\b/.test(q)) {
    const m = q.match(/\breminder\s+(?:to|about|for)\s+(.+)$/) ?? q.match(/\b(?:cancel|delete|remove)\s+(?:my\s+)?(?:the\s+)?(.+?)\s+reminder\b/);
    return { kind: "cancel", task: (m?.[1] ?? "").trim() };
  }

  if (/\b(show|list|what are|what's|whats)\b.*\b(reminders?|upcoming)\b/.test(q) || /\bupcoming reminders?\b/.test(q)) {
    return { kind: "list" };
  }

  const trigger = q.match(/\b(remind me|set (?:a |an )?reminder|add (?:a )?reminder|create (?:a )?reminder)\b/);
  if (!trigger) return null;

  let task = q.slice((trigger.index ?? 0) + trigger[0].length);
  const repeat = /\b(every ?day|daily)\b/.test(task) ? ("daily" as const) : undefined;
  let dueAt: number | null = null;

  const rel = task.match(REL_RE);
  if (rel) {
    const n = /^\d+$/.test(rel[1]!) ? parseInt(rel[1]!, 10) : 1;
    const ms = rel[2]!.startsWith("h") ? 3_600_000 : 60_000;
    if (n > 0) dueAt = now.getTime() + n * ms;
    task = task.replace(rel[0], " ");
  } else {
    const day: "today" | "tomorrow" = /\btomorrow\b/.test(task) ? "tomorrow" : "today";
    const t12 = task.match(TIME_RE);
    const t24 = t12 ? null : task.match(TIME_24H_RE);
    let h: number | null = null;
    let min = 0;
    if (t12?.[1]) {
      h = parseInt(t12[1], 10);
      min = t12[2] ? parseInt(t12[2], 10) : 0;
      if (h < 1 || h > 12 || min > 59) h = null;
      else h = (h % 12) + (t12[3] === "pm" ? 12 : 0);
      task = task.replace(t12[0], " ");
    } else if (t24?.[1]) {
      h = parseInt(t24[1], 10);
      min = parseInt(t24[2]!, 10);
      if (h > 23 || min > 59) h = null;
      task = task.replace(t24[0], " ");
    }
    if (h !== null) dueAt = resolveDue(day, h, min, now);
  }

  task = task
    .replace(/\b(today|tomorrow|every ?day|daily)\b/g, " ")
    .replace(/\b(for|at|on)\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:for|at|on)\s+/, "")
    .replace(/^(?:to|about|that)\s+/, "")
    .replace(/\s+(?:for|at|on)$/, "")
    .trim();

  if (dueAt === null) return { kind: "unclear", task: task || null };
  return { kind: "set", task: task || "reminder", dueAt, ...(repeat ? { repeat } : {}) };
}

/** Due-reminder check (pure): which reminders fire now, and the updated list. Daily ones roll to the next day. */
export function collectDue(reminders: Reminder[], now: number): { due: Reminder[]; next: Reminder[] } {
  const due = reminders.filter((r) => !r.done && !r.notified && r.dueAt <= now);
  if (!due.length) return { due, next: reminders };
  const ids = new Set(due.map((d) => d.id));
  const next = reminders.map((r) => {
    if (!ids.has(r.id)) return r;
    if (r.repeat === "daily") {
      let t = r.dueAt;
      while (t <= now) t += 86_400_000;
      return { ...r, dueAt: t };
    }
    return { ...r, notified: true };
  });
  return { due, next };
}

/** True when an identical reminder (same task, same minute) already exists and is pending. */
export function isDuplicate(reminders: Reminder[], task: string, dueAt: number): boolean {
  const t = task.toLowerCase();
  return reminders.some((r) => !r.done && r.task.toLowerCase() === t && Math.abs(r.dueAt - dueAt) < 60_000);
}

export function formatWhen(dueAt: number, now: Date = new Date()): string {
  const d = new Date(dueAt);
  const day = new Date(now); day.setHours(0, 0, 0, 0);
  const thatDay = new Date(d); thatDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((thatDay.getTime() - day.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 0) return `today at ${time}`;
  if (diffDays === 1) return `tomorrow at ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} at ${time}`;
}

export function upcoming(reminders: Reminder[], now: number = Date.now()): Reminder[] {
  return reminders
    .filter((r) => !r.done && r.dueAt > now - 60_000)
    .sort((a, b) => a.dueAt - b.dueAt);
}
