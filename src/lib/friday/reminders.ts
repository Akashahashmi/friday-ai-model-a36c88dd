/** Reminder parsing + storage helpers. Browser-only: reminders fire only while FRIDAY is open in a tab. */

export type Reminder = {
  id: string;
  task: string;
  dueAt: number; // epoch ms
  done: boolean;
  notified: boolean;
  createdAt: number;
};

export type ReminderRequest =
  | { kind: "set"; task: string; dueAt: number }
  | { kind: "unclear"; task: string | null } // has a reminder intent but no usable time
  | { kind: "list" }
  | { kind: "cancel"; task: string };

const TIME_RE = /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const TIME_24H_RE = /\bat\s+(\d{1,2}):(\d{2})\b/;

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

  if (!/\bremind me\b/.test(q)) return null;

  // Extract day + time.
  const day: "today" | "tomorrow" = /\btomorrow\b/.test(q) ? "tomorrow" : "today";
  let h: number | null = null;
  let min = 0;
  let timeSpan: string | null = null;
  const t12 = q.match(TIME_RE);
  const t24 = q.match(TIME_24H_RE);
  if (t12?.[1]) {
    h = parseInt(t12[1], 10) % 12;
    if (t12[3]!.toLowerCase() === "pm") h += 12;
    min = t12[2] ? parseInt(t12[2], 10) : 0;
    timeSpan = t12[0];
  } else if (t24?.[1]) {
    h = parseInt(t24[1], 10);
    min = parseInt(t24[2]!, 10);
    if (h > 23 || min > 59) h = null;
    timeSpan = t24[0];
  }

  // Task = text after "remind me", with the day/time fragments removed.
  let task = q.slice(q.indexOf("remind me") + "remind me".length);
  if (timeSpan) task = task.replace(timeSpan, " ");
  task = task.replace(/\b(today|tomorrow)\b/g, " ").replace(/\s+/g, " ").trim();
  task = task.replace(/^to\s+/, "").trim();

  if (h === null) return { kind: "unclear", task: task || null };
  if (!task) return { kind: "unclear", task: null };
  return { kind: "set", task, dueAt: resolveDue(day, h, min, now) };
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
