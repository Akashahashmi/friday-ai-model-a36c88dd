import { useEffect, useState } from "react";

/** Live local clock and date, updated every second from the device clock. */
export function LiveClock() {
  // null until mounted: SSR and client clocks differ, which would break hydration.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) {
    return (
      <div className="text-center" aria-label="Current local time">
        <p className="font-display text-base font-bold tabular-nums tracking-[0.2em] text-foreground sm:text-lg">--:--:--</p>
        <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">&nbsp;</p>
      </div>
    );
  }

  return (
    <div className="text-center" aria-label="Current local time">
      <p className="font-display text-base font-bold tabular-nums tracking-[0.2em] text-foreground sm:text-lg">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
      </p>
    </div>
  );
}
