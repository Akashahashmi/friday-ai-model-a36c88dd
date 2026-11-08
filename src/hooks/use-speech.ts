

import { useCallback, useEffect, useRef, useState } from "react";
import { toSpeechText } from "@/lib/friday/output";

/* Replace these placeholders with your Supabase values. */
const SUPABASE_URL = "https://mngenfsgilaqnjhvcpcx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_izPquXBCBR7IelPzE1MR5A_EJVyBiit";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Rec = any;

type SpeakHandlers = {
  onStart?: () => void;
  onEnd: () => void;
};

export function useSpeech() {
  const [recSupported, setRecSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const recRef = useRef<Rec | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<(() => void) | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = useCallback(() => {
    requestRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    window.speechSynthesis?.cancel();
    const end = endRef.current;
    endRef.current = null;
    end?.();
  }, []);

  useEffect(() => {
    const w = window as any;
    setRecSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      recRef.current?.abort?.();
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const listen = useCallback(
    (handlers: {
      onResult: (t: string) => void;
      onEnd: () => void;
      onError: (msg: string) => void;
    }) => {
      const w = window as any;
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!Ctor) {
        handlers.onError("Speech recognition isn't supported in this browser.");
        return;
      }

      const rec: Rec = new Ctor();
      rec.lang = navigator.language || "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => handlers.onResult(e.results[0][0].transcript);
      rec.onerror = (e: any) =>
        handlers.onError(
          e.error === "not-allowed"
            ? "Microphone permission was denied."
            : `Voice input error: ${e.error}`,
        );
      rec.onend = handlers.onEnd;
      recRef.current = rec;

      try {
        rec.start();
      } catch {
        handlers.onError("Couldn't start the microphone.");
        handlers.onEnd();
      }
    },
    [],
  );

  const stopListening = useCallback(() => recRef.current?.stop?.(), []);

  const speak = useCallback(
    async (original: string, _rate: number, handlers: SpeakHandlers) => {
      stopSpeaking();
      const requestId = requestRef.current;
      const text = toSpeechText(original);
      if (!text) { handlers.onEnd(); return; }
      const controller = new AbortController();
      abortRef.current = controller;
      let completed = false;
      let started = false;
      let startTimer: ReturnType<typeof setTimeout> | undefined;
      let endTimer: ReturnType<typeof setTimeout> | undefined;
      const finish = () => {
        if (completed || requestId !== requestRef.current) return;
        completed = true;
        clearTimeout(startTimer);
        clearTimeout(endTimer);
        abortRef.current?.abort();
        abortRef.current = null;
        const audio = audioRef.current;
        if (audio) {
          audio.onplaying = null; audio.onended = null; audio.onerror = null;
          audio.pause(); audio.src = ""; audioRef.current = null;
        }
        if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
        if (utteranceRef.current) {
          utteranceRef.current.onstart = null; utteranceRef.current.onend = null; utteranceRef.current.onerror = null;
          utteranceRef.current = null;
          window.speechSynthesis?.cancel();
        }
        endRef.current = null;
        handlers.onEnd();
      };
      endRef.current = () => {
        completed = true;
        clearTimeout(startTimer); clearTimeout(endTimer);
        handlers.onEnd();
      };
      const onStart = () => {
        if (completed || started || requestId !== requestRef.current) return;
        started = true;
        clearTimeout(startTimer);
        handlers.onStart?.();
        // Recovery only: normal completion follows actual playback events.
        endTimer = setTimeout(finish, Math.max(60_000, text.length * 150));
      };
      const fallback = () => {
        if (completed || requestId !== requestRef.current) return;
        const audio = audioRef.current;
        if (audio) {
          audio.onplaying = null; audio.onended = null; audio.onerror = null;
          audio.pause(); audio.src = ""; audioRef.current = null;
        }
        if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
        if (started || !("speechSynthesis" in window)) { finish(); return; }
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;
        utterance.rate = _rate;
        utterance.onstart = onStart;
        utterance.onend = finish;
        utterance.onerror = finish;
        startTimer = setTimeout(finish, 10_000);
        try { window.speechSynthesis.speak(utterance); } catch { finish(); }
      };

      try {
        startTimer = setTimeout(() => controller.abort(), 20_000);
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/gnani-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Speech service returned ${response.status}`);
        }

        const blob = await response.blob();
        if (completed || requestId !== requestRef.current) return;
        clearTimeout(startTimer);
        if (!blob.size) throw new Error("Speech service returned empty audio");

        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplaying = onStart;
        audio.onended = finish;
        audio.onerror = fallback;
        startTimer = setTimeout(finish, 10_000);
        await audio.play();
      } catch (error) {
        if (completed || requestId !== requestRef.current) return;
        clearTimeout(startTimer);
        console.error("Gnani TTS failed:", error);
        fallback();
      }
    },
    [stopSpeaking],
  );

  return {
    recSupported,
    ttsSupported,
    listen,
    stopListening,
    speak,
    stopSpeaking,
  };
}

export function playBlip(freq = 880) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.16);
    oscillator.onended = () => ctx.close();
  } catch {
    /* Audio unavailable */
  }
}
