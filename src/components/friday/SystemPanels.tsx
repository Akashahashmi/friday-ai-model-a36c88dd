import { useEffect, useState } from "react";

type Metrics = {
  cpuCores: number | null;
  ramGB: number | null;
  disk: { used: number; quota: number } | null;
  online: boolean;
  downlink: number | null;
  effectiveType: string | null;
};

function readMetrics(prev: Metrics | null): Metrics {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { downlink?: number; effectiveType?: string };
  };
  return {
    cpuCores: nav.hardwareConcurrency ?? null,
    ramGB: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    disk: prev?.disk ?? null,
    online: nav.onLine,
    downlink: typeof nav.connection?.downlink === "number" ? nav.connection.downlink : null,
    effectiveType: nav.connection?.effectiveType ?? null,
  };
}

/** Browser-accessible system metrics. Anything the browser can't report is shown as unavailable — never faked. */
function useSystemMetrics(): Metrics {
  // Keep the first browser render identical to SSR; device values arrive after mount.
  const [metrics, setMetrics] = useState<Metrics>({
    cpuCores: null,
    ramGB: null,
    disk: null,
    online: true,
    downlink: null,
    effectiveType: null,
  });

  useEffect(() => {
    let alive = true;
    const refresh = () => setMetrics((prev) => readMetrics(prev));

    const updateDisk = async () => {
      try {
        const est = await navigator.storage?.estimate?.();
        const quota = est?.quota;
        if (alive && typeof quota === "number" && quota > 0) {
          setMetrics((prev) => ({ ...prev, disk: { used: est?.usage ?? 0, quota } }));
        }
      } catch {
        /* storage estimate unsupported */
      }
    };

    refresh();
    updateDisk();
    const diskTimer = window.setInterval(updateDisk, 30_000);

    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    conn?.addEventListener?.("change", refresh);

    return () => {
      alive = false;
      window.clearInterval(diskTimer);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      conn?.removeEventListener?.("change", refresh);
    };
  }, []);

  return metrics;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Panel({ title, value, note, bar }: { title: string; value: string; note: string; bar?: number | undefined }) {
  return (
    <div className="glass rounded-xl p-3">
      <h3 className="font-display text-[10px] tracking-[0.22em] text-primary">{title}</h3>
      <p className="mt-1.5 font-mono text-lg leading-none text-foreground">{value}</p>
      {typeof bar === "number" && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(2, bar * 100))}%` }} />
        </div>
      )}
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{note}</p>
    </div>
  );
}

export function SystemPanels() {
  const m = useSystemMetrics();
  const diskPct = m.disk ? m.disk.used / m.disk.quota : undefined;

  return (
    <section aria-label="System monitors" className="grid grid-cols-2 gap-3 xl:grid-cols-1 2xl:grid-cols-2">
      <Panel
        title="CPU"
        value={m.cpuCores ? `${m.cpuCores} cores` : "—"}
        note="Live usage isn't readable from a browser — needs a desktop bridge."
      />
      <Panel
        title="RAM"
        value={m.ramGB ? `~${m.ramGB} GB` : "—"}
        note={m.ramGB ? "Approximate device memory, as reported by the browser." : "Not exposed by this browser."}
      />
      <Panel
        title="DISK"
        value={m.disk ? `${fmtBytes(m.disk.used)} / ${fmtBytes(m.disk.quota)}` : "—"}
        note={m.disk ? "Storage used by this app on your device." : "Storage estimate unavailable."}
        bar={diskPct}
      />
      <Panel
        title="NETWORK"
        value={!m.online ? "Offline" : m.downlink ? `${m.downlink} Mb/s` : "Online"}
        note={m.online ? `Browser-reported link${m.effectiveType ? ` · ${m.effectiveType}` : ""}.` : "No connection right now."}
      />
    </section>
  );
}
