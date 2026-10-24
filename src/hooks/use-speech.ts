

import { useCallback, useEffect, useRef, useState } from "react";

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

  const stopSpeaking = useCallback(() => {
    requestRef.current++;
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
    async (text: string, _rate: number, handlers: SpeakHandlers) => {
      stopSpeaking();
      const requestId = requestRef.current;

      try {
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
          },
        );

        if (!response.ok) {
          throw new Error(`Speech service returned ${response.status}`);
        }

        const blob = await response.blob();
        if (requestId !== requestRef.current) return;

        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          if (audioRef.current !== audio) return;
          audioRef.current = null;
          if (urlRef.current === url) {
            URL.revokeObjectURL(url);
            urlRef.current = null;
          }
          handlers.onEnd();
        };

        audio.onerror = () => {
          if (audioRef.current !== audio) return;
          audioRef.current = null;
          if (urlRef.current === url) {
            URL.revokeObjectURL(url);
            urlRef.current = null;
          }
          handlers.onEnd();
        };

        await audio.play();
        if (audioRef.current === audio) handlers.onStart?.();
      } catch (error) {
        if (requestId !== requestRef.current) return;
        console.error("Gnani TTS failed:", error);

        // Browser voice fallback if Gnani is temporarily unavailable.
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = _rate;
          utterance.onstart = handlers.onStart ?? null;
          utterance.onend = handlers.onEnd;
          utterance.onerror = handlers.onEnd;
          window.speechSynthesis.speak(utterance);
        } else {
          handlers.onEnd();
        }
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
