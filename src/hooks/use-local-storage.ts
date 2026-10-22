import { useEffect, useState } from "react";

/** SSR-safe localStorage state: loads after hydration, then persists changes. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch { /* ignore corrupt storage */ }
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  }, [key, value, loaded]);
  return [value, setValue] as const;
}
