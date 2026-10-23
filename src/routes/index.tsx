import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Settings, Activity, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Orb, STATE_LABEL } from "@/components/friday/Orb";
import { QuickActions, type QuickAction } from "@/components/friday/QuickActions";
import { ActivityPanel } from "@/components/friday/ActivityPanel";
import { SettingsDialog } from "@/components/friday/SettingsDialog";
import { Composer } from "@/components/friday/Composer";
import { MessageList } from "@/components/friday/MessageList";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSpeech, playBlip } from "@/hooks/use-speech";
import { DemoProvider } from "@/lib/friday/demo-provider";
import { evaluateExpression } from "@/lib/friday/calc";
import { DEFAULT_PREFS, type ActivityItem, type AssistantState, type ChatMessage, type Preferences } from "@/lib/friday/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRIDAY AI — Personal Assistant" },
      { name: "description", content: "A futuristic personal assistant interface with voice input, an animated AI core, and quick actions." },
      { property: "og:title", content: "FRIDAY AI — Personal Assistant" },
      { property: "og:description", content: "A futuristic personal assistant interface with voice input and quick actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Friday,
});

const uid = () => Math.random().toString(36).slice(2, 10);
const provider = DemoProvider; // Swap for a server-backed provider later.

const GREETING = "Hi bruh, how's your day going?";
// Module-level guards: survive React re-renders/StrictMode remounts, reset on real reload.
let greetingQueued = false;
let greetingSpoken = false;

function Friday() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>("friday.messages", []);
  const [activity, setActivity] = useLocalStorage<ActivityItem[]>("friday.activity", []);
  const [prefs, setPrefs] = useLocalStorage<Preferences>("friday.prefs", DEFAULT_PREFS);
  const [state, setState] = useState<AssistantState>("idle");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activationNeeded, setActivationNeeded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const speech = useSpeech();
  const { speak, stopSpeaking, ttsSupported } = speech;

  const log = useCallback((label: string) => setActivity((a) => [{ id: uid(), label, at: Date.now() }, ...a].slice(0, 30)), [setActivity]);
  const blip = (f?: number) => prefs.uiSounds && playBlip(f);

  // Voice-first: every assistant reply is spoken unless muted/unsupported.
  // The "speaking" state follows the real utterance onstart/onend events.
  const speakReply = useCallback(
    (text: string) => {
      if (!prefs.voiceReplies || prefs.muted || !ttsSupported) {
        setState("idle");
        return;
      }
      speak(text, prefs.speechRate, {
        onStart: () => setState("speaking"),
        onEnd: () => setState((s) => (s === "speaking" ? "idle" : s)),
      });
    },
    [prefs.voiceReplies, prefs.muted, prefs.speechRate, ttsSupported, speak],
  );

  const addAssistant = (text: string, demo = false) => {
    setMessages((m) => [...m, { id: uid(), role: "assistant", text, at: Date.now(), demo }]);
    speakReply(text);
  };

  // Greeting: shown once per page load in the conversation…
  useEffect(() => {
    if (greetingQueued) return;
    greetingQueued = true;
    setMessages((m) => [...m, { id: uid(), role: "assistant", text: GREETING, at: Date.now() }]);
    setActivity((a) => [{ id: uid(), label: "Greeted user", at: Date.now() }, ...a].slice(0, 30));
  }, [setMessages, setActivity]);

  // …and spoken once browser TTS is available. If autoplay is blocked,
  // offer a "Tap to activate" button instead of claiming it was spoken.
  useEffect(() => {
    if (greetingSpoken || !ttsSupported) return;
    greetingSpoken = true;
    let started = false;
    speak(GREETING, 1, {
      onStart: () => {
        started = true;
        setState("speaking");
      },
      onEnd: () => setState((s) => (s === "speaking" ? "idle" : s)),
    });
    const t = window.setTimeout(() => {
      if (!started) {
        stopSpeaking();
        setState("idle");
        setActivationNeeded(true);
      }
    }, 1500);
    return () => window.clearTimeout(t);
  }, [ttsSupported, speak, stopSpeaking]);

  const activate = () => {
    setActivationNeeded(false);
    speak(GREETING, prefs.speechRate, {
      onStart: () => setState("speaking"),
      onEnd: () => setState((s) => (s === "speaking" ? "idle" : s)),
    });
    log("Voice activated");
  };

  const toggleMute = () => {
    const next = !prefs.muted;
    if (next) {
      stopSpeaking();
      setState((s) => (s === "speaking" ? "idle" : s));
      log("Voice muted");
    } else log("Voice unmuted");
    setPrefs({ ...prefs, muted: next });
  };

  const send = async (text: string) => {
    speech.stopSpeaking();
    blip(660);
    const userMsg: ChatMessage = { id: uid(), role: "user", text, at: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    log("Message sent");
    setState("processing");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const reply = await provider.reply(history, ctrl.signal);
      addAssistant(reply, provider.isDemo);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setState("idle");
      toast.error("FRIDAY couldn't respond. Please try again.");
    }
  };

  const toggleMic = () => {
    if (state === "listening") return speech.stopListening();
    speech.stopSpeaking();
    blip(990);
    setState("listening");
    log("Voice input started");
    let got = false;
    speech.listen({
      onResult: (t) => { got = true; send(t); },
      onEnd: () => { if (!got) setState((s) => (s === "listening" ? "idle" : s)); },
      onError: (msg) => { toast.error(msg); setState("idle"); },
    });
  };

  const onAction = (a: QuickAction) => {
    blip();
    switch (a) {
      case "time": {
        const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        log("Checked current time");
        addAssistant(`The current time is ${t}.`);
        break;
      }
      case "youtube":
      case "google":
        // Navigation is handled by the anchor link itself; just log it.
        log(`Opened ${a === "youtube" ? "YouTube" : "Google"}`);
        break;
      case "calculator": {
        const expr = window.prompt("Enter a calculation (e.g. (12 + 8) * 3):");
        if (!expr) return;
        const r = evaluateExpression(expr);
        log("Used calculator");
        setMessages((m) => [...m, { id: uid(), role: "user", text: `Calculate ${expr}`, at: Date.now() }]);
        addAssistant(r === null ? "That doesn't look like a valid calculation." : `${expr} = ${r}`);
        break;
      }
      case "clear":
        abortRef.current?.abort();
        speech.stopSpeaking();
        setMessages([]);
        setState("idle");
        log("Conversation cleared");
        toast.success("Conversation cleared");
        break;
    }
  };

  const panel = (
    <ActivityPanel state={state} messageCount={messages.length} provider={provider.name} recSupported={speech.recSupported} ttsSupported={speech.ttsSupported} activity={activity} />
  );

  return (
    <div className={`flex h-dvh flex-col ${prefs.animations ? "" : "no-motion"}`}>
      <header className="glass flex items-center justify-between border-x-0 border-t-0 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="size-2.5 rounded-full bg-primary glow-ring" />
          <h1 className="font-display text-lg font-bold tracking-[0.3em] text-primary glow-text">FRIDAY<span className="text-foreground"> AI</span></h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            aria-label={prefs.muted ? "Unmute voice" : "Mute voice"}
            aria-pressed={prefs.muted}
            title={prefs.muted ? "Unmute voice" : "Mute voice"}
            className="grid size-10 place-items-center rounded-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {prefs.muted ? <VolumeX className="size-5 text-muted-foreground" /> : <Volume2 className="size-5 text-primary" />}
          </button>
          <button onClick={() => setPanelOpen(true)} aria-label="Open activity panel" className="grid size-10 place-items-center rounded-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
            <Activity className="size-5" />
          </button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Open settings" className="grid size-10 place-items-center rounded-lg transition-transform hover:rotate-45 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 p-3 sm:p-4">
        <aside className="glass hidden w-60 shrink-0 rounded-2xl p-4 md:block">
          <h2 className="mb-3 font-display text-[11px] tracking-[0.2em] text-primary">QUICK ACTIONS</h2>
          <QuickActions onAction={onAction} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="md:hidden"><QuickActions onAction={onAction} layout="row" /></div>
          <section className="flex flex-col items-center gap-3 pt-2">
            <Orb state={state} animate={prefs.animations} />
            <p className="font-display text-xs tracking-[0.35em] text-primary" role="status" aria-live="polite">
              {STATE_LABEL[state].toUpperCase()}
            </p>
          </section>
          <section className="glass min-h-0 flex-1 overflow-y-auto rounded-2xl p-4" aria-label="Conversation">
            <MessageList messages={messages} thinking={state === "processing"} />
          </section>
          <Composer state={state} recSupported={speech.recSupported} onSend={send} onMic={toggleMic} />
          {activationNeeded && (
            <button
              onClick={activate}
              className="glass glow-ring msg-in mx-auto w-fit rounded-full px-6 py-2.5 font-display text-xs tracking-[0.25em] text-primary transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              TAP TO ACTIVATE FRIDAY
            </button>
          )}
        </main>

        <aside className="glass hidden w-64 shrink-0 rounded-2xl p-4 lg:block">{panel}</aside>
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="glass border-border">
          <SheetHeader><SheetTitle className="font-display tracking-widest text-primary">ACTIVITY</SheetTitle></SheetHeader>
          <div className="px-4">{panel}</div>
        </SheetContent>
      </Sheet>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} prefs={prefs} setPrefs={setPrefs} ttsSupported={speech.ttsSupported} />
    </div>
  );
}
