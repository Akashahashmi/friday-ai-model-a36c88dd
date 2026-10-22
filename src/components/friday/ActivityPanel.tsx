import type { ActivityItem, AssistantState } from "@/lib/friday/types";
import { STATE_LABEL } from "./Orb";

function Row({ k, v, tone }: { k: string; v: string; tone?: "ok" | "warn" | "muted" }) {
  const c = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className={`font-mono ${c}`}>{v}</span>
    </div>
  );
}

export function ActivityPanel(p: {
  state: AssistantState;
  messageCount: number;
  provider: string;
  recSupported: boolean;
  ttsSupported: boolean;
  activity: ActivityItem[];
}) {
  return (
    <div className="flex h-full flex-col gap-5">
      <section>
        <h2 className="mb-2 font-display text-[11px] tracking-[0.2em] text-primary">STATUS</h2>
        <div className="divide-y divide-border">
          <Row k="Assistant" v={STATE_LABEL[p.state]} tone="ok" />
          <Row k="Responses" v={p.provider} tone="warn" />
          <Row k="AI model" v="Not connected" tone="muted" />
          <Row k="Voice input" v={p.recSupported ? "Browser supported" : "Unsupported"} tone={p.recSupported ? "ok" : "muted"} />
          <Row k="Voice output" v={p.ttsSupported ? "Browser supported" : "Unsupported"} tone={p.ttsSupported ? "ok" : "muted"} />
          <Row k="Messages" v={String(p.messageCount)} />
        </div>
      </section>
      <section className="min-h-0 flex-1">
        <h2 className="mb-2 font-display text-[11px] tracking-[0.2em] text-primary">RECENT ACTIVITY</h2>
        {p.activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="space-y-2 overflow-y-auto">
            {p.activity.slice(0, 12).map((a) => (
              <li key={a.id} className="msg-in flex gap-2 text-xs">
                <span className="font-mono text-muted-foreground">
                  {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span>{a.label}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
