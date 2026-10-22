import { Calculator, Clock, Globe, Trash2, Youtube } from "lucide-react";

export type QuickAction = "time" | "youtube" | "google" | "calculator" | "clear";

const ACTIONS: { id: QuickAction; label: string; icon: typeof Clock }[] = [
  { id: "time", label: "Current Time", icon: Clock },
  { id: "youtube", label: "Open YouTube", icon: Youtube },
  { id: "google", label: "Open Google", icon: Globe },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "clear", label: "Clear Conversation", icon: Trash2 },
];

export function QuickActions({ onAction, layout = "list" }: { onAction: (a: QuickAction) => void; layout?: "list" | "row" }) {
  return (
    <nav aria-label="Quick actions" className={layout === "row" ? "flex gap-2 overflow-x-auto pb-1" : "flex flex-col gap-2"}>
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onAction(id)}
          className={`group flex shrink-0 items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-left text-sm transition-all hover:border-primary/60 hover:bg-secondary hover:glow-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${id === "clear" ? "text-muted-foreground hover:text-destructive" : ""}`}
        >
          <Icon className="size-4 text-primary transition-transform group-hover:scale-110" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
