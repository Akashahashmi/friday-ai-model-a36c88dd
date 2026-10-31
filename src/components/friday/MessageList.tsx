import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/friday/types";

export function MessageList({ messages, thinking }: { messages: ChatMessage[]; thinking: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, thinking]);

  if (messages.length === 0 && !thinking) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Say hello, ask the time, or try “12 * 7”.</p>;
  }
  return (
    <div role="log" aria-live="polite" className="space-y-3">
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="msg-in flex justify-end">
            <p className="max-w-[80%] break-words rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.text}</p>
          </div>
        ) : m.role === "system" ? (
          <p key={m.id} className="msg-in text-center font-mono text-xs text-muted-foreground">— {m.text} —</p>
        ) : (
          <div key={m.id} className="msg-in max-w-[85%]">
            <div className="mb-1 flex items-center gap-2 font-display text-[10px] tracking-[0.2em] text-primary">
              FRIDAY
              {m.demo && <span className="rounded border border-warn/40 px-1.5 py-px font-mono text-[9px] tracking-normal text-warn">DEMO RESPONSE</span>}
            </div>
            <p className="break-words text-sm leading-relaxed">{m.text}</p>
          </div>
        ),
      )}
      {thinking && (
        <div className="flex items-center gap-1.5 text-primary" aria-label="FRIDAY is thinking">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      )}
      <div ref={end} />
    </div>
  );
}
