import { Mic, MicOff, SendHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { AssistantState } from "@/lib/friday/types";

export function Composer({ state, recSupported, onSend, onMic }: {
  state: AssistantState;
  recSupported: boolean;
  onSend: (t: string) => void;
  onMic: () => void;
}) {
  const [text, setText] = useState("");
  const busy = state === "processing";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText("");
  };
  const listening = state === "listening";
  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-input bg-background/60 p-1.5 transition-colors focus-within:border-primary/50">
      <button
        type="button"
        onClick={onMic}
        disabled={!recSupported || busy}
        aria-label={listening ? "Stop listening" : "Start voice input"}
        title={recSupported ? "Voice input" : "Voice input isn't supported in this browser"}
        className={`grid size-9 shrink-0 place-items-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 ${listening ? "bg-primary text-primary-foreground" : "bg-secondary text-primary hover:bg-muted"}`}
      >
        {recSupported ? <Mic className="size-4" /> : <MicOff className="size-4" />}
      </button>
      <label htmlFor="msg" className="sr-only">Message FRIDAY</label>
      <input
        id="msg"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={listening ? "Listening…" : "Ask FRIDAY anything…"}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        disabled={!text.trim() || busy}
        aria-label="Send message"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        <SendHorizontal className="size-4" />
      </button>
    </form>
  );
}
