import { describe, expect, it } from "vitest";
import { collectDue, formatWhen, isDuplicate, parseReminder, upcoming, type Reminder } from "./reminders";

// Fixed "now": Wednesday 2026-11-04, 15:00 local time.
const NOW = new Date(2026, 10, 4, 15, 0, 0);

describe("parseReminder", () => {
  it("parses 'remind me to study Maths at 7 PM' as today 19:00", () => {
    const r = parseReminder("FRIDAY, remind me to study Maths at 7 PM.", NOW);
    expect(r).toMatchObject({ kind: "set", task: "study maths" });
    if (r?.kind !== "set") return;
    const d = new Date(r.dueAt);
    expect(d.getHours()).toBe(19);
    expect(d.getMinutes()).toBe(0);
    expect(d.getDate()).toBe(NOW.getDate());
  });

  it("parses 'tomorrow at 9 AM' as next day 09:00", () => {
    const r = parseReminder("Remind me tomorrow at 9 AM to revise C programming", NOW);
    expect(r).toMatchObject({ kind: "set", task: "revise c programming" });
    if (r?.kind !== "set") return;
    const d = new Date(r.dueAt);
    expect(d.getHours()).toBe(9);
    expect(d.getDate()).toBe(NOW.getDate() + 1);
  });

  it("rolls a past time today over to tomorrow", () => {
    const r = parseReminder("remind me to drink water at 2 PM", NOW); // 14:00 < 15:00
    if (r?.kind !== "set") throw new Error("expected set");
    expect(new Date(r.dueAt).getDate()).toBe(NOW.getDate() + 1);
  });

  it("parses 24-hour 'at 18:30'", () => {
    const r = parseReminder("remind me to call mom at 18:30", NOW);
    if (r?.kind !== "set") throw new Error("expected set");
    const d = new Date(r.dueAt);
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(30);
  });

  it("asks for clarification when no time is given", () => {
    expect(parseReminder("remind me to study Maths", NOW)).toEqual({ kind: "unclear", task: "study maths" });
  });

  it("parses list requests", () => {
    expect(parseReminder("Show my upcoming reminders", NOW)).toEqual({ kind: "list" });
  });

  it("parses cancel requests with the task name", () => {
    expect(parseReminder("Cancel my reminder to study Maths", NOW)).toEqual({ kind: "cancel", task: "study maths" });
  });

  it("returns null for unrelated messages", () => {
    expect(parseReminder("what is the time", NOW)).toBeNull();
  });
});

describe("isDuplicate", () => {
  const base: Reminder = { id: "a", task: "Study Maths", dueAt: NOW.getTime() + 3600_000, done: false, notified: false, createdAt: NOW.getTime() };
  it("detects same task at the same minute", () => {
    expect(isDuplicate([base], "study maths", base.dueAt)).toBe(true);
  });
  it("allows same task at a different time", () => {
    expect(isDuplicate([base], "study maths", base.dueAt + 3600_000)).toBe(false);
  });
  it("ignores completed reminders", () => {
    expect(isDuplicate([{ ...base, done: true }], "study maths", base.dueAt)).toBe(false);
  });
});

describe("formatWhen / upcoming", () => {
  it("labels today and tomorrow", () => {
    const today = new Date(2026, 10, 4, 19, 0).getTime();
    const tomorrow = new Date(2026, 10, 5, 9, 0).getTime();
    expect(formatWhen(today, NOW)).toMatch(/^today at /);
    expect(formatWhen(tomorrow, NOW)).toMatch(/^tomorrow at /);
  });

  it("upcoming excludes done and long-past reminders and sorts by time", () => {
    const rs: Reminder[] = [
      { id: "1", task: "b", dueAt: NOW.getTime() + 7200_000, done: false, notified: false, createdAt: 0 },
      { id: "2", task: "a", dueAt: NOW.getTime() + 3600_000, done: false, notified: false, createdAt: 0 },
      { id: "3", task: "done", dueAt: NOW.getTime() + 1000, done: true, notified: false, createdAt: 0 },
      { id: "4", task: "old", dueAt: NOW.getTime() - 3600_000, done: false, notified: true, createdAt: 0 },
    ];
    expect(upcoming(rs, NOW.getTime()).map((r) => r.task)).toEqual(["a", "b"]);
  });
});

describe("relative and repeating reminders", () => {
  const min = 60_000;
  it("'in 2 minutes' is now + 2 min", () => {
    const r = parseReminder("remind me to stretch in 2 minutes", NOW);
    expect(r).toMatchObject({ kind: "set", task: "stretch", dueAt: NOW.getTime() + 2 * min });
  });
  it("'after 5 minutes' is now + 5 min", () => {
    const r = parseReminder("remind me after 5 minutes to drink water", NOW);
    expect(r).toMatchObject({ kind: "set", dueAt: NOW.getTime() + 5 * min });
  });
  it("'set a reminder for 10 minutes from now' with no task", () => {
    expect(parseReminder("set a reminder for 10 minutes from now", NOW)).toEqual({ kind: "set", task: "reminder", dueAt: NOW.getTime() + 10 * min });
  });
  it("'in 1 hour' is now + 60 min", () => {
    const r = parseReminder("remind me in 1 hour to study", NOW);
    expect(r).toMatchObject({ kind: "set", dueAt: NOW.getTime() + 60 * min });
  });
  it("'every day at 7 AM' is daily", () => {
    const r = parseReminder("remind me every day at 7 AM to exercise", NOW);
    expect(r).toMatchObject({ kind: "set", task: "exercise", repeat: "daily" });
  });
});

describe("collectDue", () => {
  const t = NOW.getTime();
  const r = (o: Partial<Reminder>): Reminder => ({ id: "x", task: "t", dueAt: t - 1000, done: false, notified: false, createdAt: 0, ...o });
  it("fires a due one-off once", () => {
    const { due, next } = collectDue([r({})], t);
    expect(due).toHaveLength(1);
    expect(collectDue(next, t).due).toHaveLength(0);
  });
  it("does not fire future reminders", () => {
    expect(collectDue([r({ dueAt: t + 1000 })], t).due).toHaveLength(0);
  });
  it("rolls a daily reminder to the next day", () => {
    const { next } = collectDue([r({ repeat: "daily" })], t);
    expect(next[0]!.dueAt).toBe(t - 1000 + 86_400_000);
    expect(next[0]!.notified).toBe(false);
  });
});
