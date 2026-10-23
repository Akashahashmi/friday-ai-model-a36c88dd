import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Rec = any;

export function useSpeech() {
  const [recSupported, setRecSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const recRef = useRef<Rec | null>(null);

  useEffect(() => {
    const w = window as any;
    setRecSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    setTtsSupported("speechSynthesis" in window);
    return () => { recRef.current?.abort?.(); window.speechSynthesis?.cancel(); };
  }, []);

  const listen = useCallback(
    (handlers: { onResult: (t: string) => void; onEnd: () => void; onError: (msg: string) => void }) => {
      const w = window as any;
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!Ctor) return handlers.onError("Speech recognition isn't supported in this browser.");
      const rec: Rec = new Ctor();
      rec.lang = navigator.language || "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => handlers.onResult(e.results[0][0].transcript);
      rec.onerror = (e: any) =>
        handlers.onError(e.error === "not-allowed" ? "Microphone permission was denied." : `Voice input error: ${e.error}`);
      rec.onend = handlers.onEnd;
      recRef.current = rec;
      try { rec.start(); } catch { handlers.onError("Couldn't start the microphone."); handlers.onEnd(); }
    },
    [],
  );

  const stopListening = useCallback(() => recRef.current?.stop?.(), []);

  const speak = useCallback((text: string, rate: number, handlers: { onStart?: () => void; onEnd: () => void }) => {
    if (!("speechSynthesis" in window)) return handlers.onEnd();
    window.speechSynthesis.cancel(); // prevent overlapping speech
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.onstart = handlers.onStart ?? null;
    u.onend = handlers.onEnd;
    u.onerror = handlers.onEnd;
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => window.speechSynthesis?.cancel(), []);

  return { recSupported, ttsSupported, listen, stopListening, speak, stopSpeaking };
}

export function playBlip(freq = 880) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.16);
    o.onended = () => ctx.close();
  } catch { /* audio unavailable */ }
}
