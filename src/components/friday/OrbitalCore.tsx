import type { AssistantState } from "@/lib/friday/types";

export const STATE_LABEL: Record<AssistantState, string> = {
  idle: "Idle",
  listening: "Listening",
  processing: "Thinking",
  speaking: "Speaking",
  error: "Error",
};

/**
 * Central holographic orb: luminous cyan-blue core, tilted orbital rings
 * rotating at different speeds, orbiting particles, and the FRIDAY AI label.
 * Pure CSS/SVG — animations are driven by data-state (see styles.css).
 */
export function OrbitalCore({ state, animate }: { state: AssistantState; animate: boolean }) {
  return (
    <div
      className="orbital mx-auto w-52 sm:w-64 xl:w-72 2xl:w-80"
      data-state={state}
      data-reduced={!animate}
      aria-hidden="true"
    >
      <div className="orbital-scene">
        <div className="orbital-halo" />
        <div className="orbital-ring ring-a">
          <div className="orbital-ring-inner">
            <span className="orbital-dot" />
          </div>
        </div>
        <div className="orbital-ring ring-b">
          <div className="orbital-ring-inner">
            <span className="orbital-dot" />
          </div>
        </div>
        <div className="orbital-ring ring-c">
          <div className="orbital-ring-inner">
            <span className="orbital-dot" />
          </div>
        </div>
        <div className="orbital-ring ring-d">
          <div className="orbital-ring-inner" />
        </div>
        <div className="orbital-core" />
        <div className="orbital-pulse" />
      </div>
      <div className="orbital-label">
        <span className="orbital-title">FRIDAY AI</span>
      </div>
    </div>
  );
}
