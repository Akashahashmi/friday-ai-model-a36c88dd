import type { AssistantState } from "@/lib/friday/types";

export function Orb({ state, animate }: { state: AssistantState; animate: boolean }) {
  return (
    <div className="orb w-40 sm:w-56" data-state={state} data-reduced={!animate} aria-hidden="true">
      <div className="orb-ring r3" />
      <div className="orb-ring r2" />
      <div className="orb-ring r1" />
      <div className="orb-pulse" />
      <div className="orb-core" />
    </div>
  );
}

export const STATE_LABEL: Record<AssistantState, string> = {
  idle: "Idle",
  listening: "Listening",
  processing: "Processing",
  speaking: "Speaking",
};
