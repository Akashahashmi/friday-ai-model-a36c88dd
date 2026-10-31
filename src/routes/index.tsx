import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OrbitalCore, STATE_LABEL } from "@/components/friday/OrbitalCore";
import { parseIntent, JOKES, type Intent } from "@/lib/friday/actions";
import { ActivityPanel } from "@/components/friday/ActivityPanel";
import { SystemPanels } from "@/components/friday/SystemPanels";
import { LiveClock } from "@/components/friday/LiveClock";
import { Composer } from "@/components/friday/Composer";
import { MessageList } from "@/components/friday/MessageList";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSpeech, playBlip } from "@/hooks/use-speech";
import { FridayAIProvider } from "@/lib/friday/openai-provider";
import { evaluateExpression } from "@/lib/friday/calc";
import { DEFAULT_PREFS, type ActivityItem, type AssistantState, type ChatMessage, type Preferences } from "@/lib/friday/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRIDAY AI — Personal Assistant" },
      { name: "description", content: "A futuristic orbital mission-control interface for the FRIDAY AI voice assistant." },
      { property: "og:title", content: "FRIDAY AI — Personal Assistant" },
      { property: "og:description", content: "A futuristic orbital mission-control interface for the FRIDAY AI voice assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Friday,
});

const uid = () => Math.random().toString(36).slice(2, 10);
const provider = FridayAIProvider; // Swap for a server-backed provider later.

const GREETING = "Hello boss, what's up?";
// Module-level guards: survive React re-renders/StrictMode remounts, reset on real reload.
let greetingQueued = false;
let greetingSpoken = false;

function Friday() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>("friday.messages", []);
  const [activity, setActivity] = useLocalStorage<ActivityItem[]>("friday.activity", []);
  const [prefs, setPrefs] = useLocalStorage<Preferences>("friday.prefs", DEFAULT_PREFS);
  const [state, setState] = useState<AssistantState>("idle");
  const [activationNeeded, setActivationNeeded] = useState(false);
  const [pendingLink, setPendingLink] = useState<{ url: string; label: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const speech = useSpeech();
  const { speak, stopSpeaking, ttsSupported } = speech;

  const log = useCallback((label: string) => setActivity((a) => [{ id: uid(), label, at: Date.now() }, ...a].slice(0, 30)), [setActivity]);
  const blip = (f?: number) => prefs.uiSounds && playBlip(f);

  useEffect(() => () => { if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current); }, []);

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
        // Fires on end AND on error; clear processing/speaking either way.
        onEnd: () => setState((s) => (s === "speaking" || s === "processing" ? "idle" : s)),
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
      // No onstart within 1.5s (autoplay blocked or no voices): offer manual activation.
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
      onEnd: () => setState((s) => (s === "speaking" || s === "processing" ? "idle" : s)),
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

  const clearConversation = () => {
    if (!window.confirm("Clear the whole conversation? This can't be undone.")) return false;
    abortRef.current?.abort();
    speech.stopSpeaking();
    setMessages([]);
    setState("idle");
    log("Conversation cleared");
    toast.success("Conversation cleared");
    return true;
  };

  const openExternal = (url: string, label: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    // window.open returns null with noopener even on success in some browsers, so always offer the link too.
    setPendingLink({ url, label });
    log(`Opened ${label}`);
  };

  const runCalculator = () => {
    const expr = window.prompt("Enter a calculation (e.g. (12 + 8) * 3):");
    if (!expr) return;
    const r = evaluateExpression(expr);
    log("Used calculator");
    setMessages((m) => [...m, { id: uid(), role: "user", text: `Calculate ${expr}`, at: Date.now() }]);
    addAssistant(r === null ? "That doesn't look like a valid calculation." : `${expr} = ${r}`);
  };

  const runIntent = (intent: Intent): boolean => {
    const reply = (t: string) => addAssistant(t);
    switch (intent.kind) {
      case "open": {
        const label = intent.site === "google" ? "Google" : "YouTube";
        openExternal(intent.url, label);
        reply(`Opening ${label}, boss. If a new tab didn't appear, use the link below.`);
        return true;
      }
      case "search":
        openExternal(intent.url, `Google search: ${intent.query}`);
        reply(`Searching Google for "${intent.query}". If no tab opened, use the link below.`);
        return true;
      case "calculator":
        runCalculator();
        return true;
      case "time":
        log("Checked current time");
        reply(`It's ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, boss.`);
        return true;
      case "date":
        reply(`Today is ${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`);
        return true;
      case "clear":
        if (!clearConversation()) reply("Okay, I kept our conversation.");
        return true;
      case "joke":
        log("Told a joke");
        reply(JOKES[Math.floor(Math.random() * JOKES.length)] ?? JOKES[0]!);
        return true;
      case "stop":
        speech.stopSpeaking();
        setState("idle");
        return true;
      case "mute":
        if (!prefs.muted) toggleMute();
        setMessages((m) => [...m, { id: uid(), role: "assistant", text: "Voice muted. Say or type \"unmute\" to hear me again.", at: Date.now() }]);
        setState("idle");
        return true;
      case "unmute":
        if (prefs.muted) setPrefs({ ...prefs, muted: false });
        log("Voice unmuted");
        setMessages((m) => [...m, { id: uid(), role: "assistant", text: "I'm back online, boss.", at: Date.now() }]);
        speak("I'm back online, boss.", prefs.speechRate, { onStart: () => setState("speaking"), onEnd: () => setState("idle") });
        return true;
      case "repeat": {
        const last = [...messages].reverse().find((m) => m.role === "assistant");
        reply(last ? last.text : "There's nothing to repeat yet.");
        return true;
      }
      case "desktop":
        reply("I'm running in your browser, so I can't open desktop apps or change system settings. I can open websites, search Google, do calculations and tell the time.");
        return true;
    }
  };

  const send = async (text: string) => {
    speech.stopSpeaking();
    blip(660);
    const userMsg: ChatMessage = { id: uid(), role: "user", text, at: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    log("Message sent");
    const intent = parseIntent(text);
    if (intent && runIntent(intent)) return;
    setState("processing");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const reply = await provider.reply(history, ctrl.signal);
      addAssistant(reply, provider.isDemo);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      // Restrained error state on the orb, then back to idle.
      setState("error");
      toast.error("FRIDAY couldn't respond. Please try again.");
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setState((s) => (s === "error" ? "idle" : s)), 2500);
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

  return (
    <div className={`flex h-dvh flex-col ${prefs.animations ? "" : "no-motion"}`}>
      <header className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-x-0 border-t-0 px-4 py-3 sm:flex sm:flex-wrap sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-2.5 shrink-0 rounded-full bg-primary glow-ring" />
          <h1 className="truncate font-display text-base font-bold tracking-[0.18em] text-primary glow-text sm:text-lg sm:tracking-[0.3em]">FRIDAY<span className="text-foreground"> AI</span></h1>
        </div>
        <LiveClock />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={prefs.muted ? "Unmute voice" : "Mute voice"}
            aria-pressed={prefs.muted}
            title={prefs.muted ? "Unmute voice" : "Mute voice"}
            className="grid size-10 place-items-center rounded-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {prefs.muted ? <VolumeX className="size-5 text-muted-foreground" /> : <Volume2 className="size-5 text-primary" />}
          </button>
          <button
            onClick={clearConversation}
            className="glass flex items-center gap-2 rounded-lg px-3 py-2 font-display text-[11px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary hover:glow-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="size-3.5" /> CLEAR CONVERSATION
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-4 xl:grid xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)_minmax(250px,290px)] xl:overflow-hidden">
        {/* Central orbital hologram */}
        <section className="order-1 flex flex-col items-center justify-center gap-3 py-2 xl:order-2 xl:min-h-0" aria-label="FRIDAY core">
          <OrbitalCore state={state} animate={prefs.animations} />
          <p className="font-display text-xs tracking-[0.35em] text-primary" role="status" aria-live="polite">
            {STATE_LABEL[state].toUpperCase()}
          </p>
          {state === "speaking" && (
            <button
              onClick={() => { speech.stopSpeaking(); setState("idle"); }}
              aria-label="Stop speaking"
              className="glass flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-[11px] tracking-[0.2em] text-primary hover:glow-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Square className="size-3 fill-current" /> STOP SPEAKING
            </button>
          )}
          {activationNeeded && (
            <button
              onClick={activate}
              className="glass glow-ring msg-in rounded-full px-6 py-2.5 font-display text-xs tracking-[0.25em] text-primary transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              TAP TO ACTIVATE FRIDAY
            </button>
          )}
        </section>

        {/* Chat panel */}
        <section className="order-2 flex min-h-[55vh] min-w-0 flex-col gap-3 xl:order-1 xl:min-h-0" aria-label="Conversation">
          <div className="glass min-h-0 flex-1 overflow-y-auto rounded-2xl p-4 sm:p-5">
            <MessageList messages={messages} thinking={state === "processing"} />
          </div>
          {pendingLink && (
            <div className="glass msg-in flex items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm">
              <a href={pendingLink.url} target="_blank" rel="noopener noreferrer" className="truncate text-primary underline underline-offset-4">
                Open {pendingLink.label}
              </a>
              <button onClick={() => setPendingLink(null)} aria-label="Dismiss link" className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}
          <Composer state={state} recSupported={speech.recSupported} onSend={send} onMic={toggleMic} />
        </section>

        {/* System monitors + status/activity */}
        <aside className="order-3 flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto">
          <SystemPanels />
          <div className="glass hidden min-h-0 flex-1 rounded-2xl p-4 xl:block">
            <ActivityPanel state={state} messageCount={messages.length} provider={provider.name} recSupported={speech.recSupported} ttsSupported={speech.ttsSupported} activity={activity} />
          </div>
        </aside>
      </div>
    </div>
  );
}
