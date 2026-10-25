import { useEffect, useState } from "react";

/** Live local clock and date, updated every second from the device clock. */
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
