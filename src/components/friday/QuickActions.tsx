import { Calculator, Clock, Globe, Trash2, Youtube } from "lucide-react";

export type QuickAction = "time" | "youtube" | "google" | "calculator" | "clear";

const ACTIONS: { id: QuickAction; label: string; icon: typeof Clock; href?: string }[] = [
  { id: "time", label: "Current Time", icon: Clock },
  { id: "youtube", label: "Open YouTube", icon: Youtube, href: "https://www.youtube.com/" },
  { id: "google", label: "Open Google", icon: Globe, href: "https://www.google.com/" },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "clear", label: "Clear Conversation", icon: Trash2 },
];

const itemClass = (id: QuickAction) =>
  `group flex shrink-0 items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-left text-sm transition-all hover:border-primary/60 hover:bg-secondary hover:glow-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${id === "clear" ? "text-muted-foreground hover:text-destructive" : ""}`;

export function QuickActions({ onAction, layout = "list" }: { onAction: (a: QuickAction) => void; layout?: "list" | "row" }) {
  return (
    <nav aria-label="Quick actions" className={layout === "row" ? "flex gap-2 overflow-x-auto pb-1" : "flex flex-col gap-2"}>
      {ACTIONS.map(({ id, label, icon: Icon, href }) =>
        href ? (
          // Standard anchor navigation: works inside the preview iframe, unlike window.open pop-ups.
          <a key={id} href={href} target="_blank" rel="noopener noreferrer" onClick={() => onAction(id)} className={itemClass(id)}>
            <Icon className="size-4 text-primary transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </a>
        ) : (
          <button key={id} onClick={() => onAction(id)} className={itemClass(id)}>
            <Icon className="size-4 text-primary transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </button>
        ),
      )}
    </nav>
  );
}
