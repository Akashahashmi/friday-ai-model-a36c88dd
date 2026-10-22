export type AssistantState = "idle" | "listening" | "processing" | "speaking";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  at: number;
  demo?: boolean;
}

export interface ActivityItem {
  id: string;
  label: string;
  at: number;
}

export interface Preferences {
  animations: boolean;
  voiceReplies: boolean;
  uiSounds: boolean;
  speechRate: number;
}

export const DEFAULT_PREFS: Preferences = {
  animations: true,
  voiceReplies: false,
  uiSounds: true,
  speechRate: 1,
};

/** Pluggable response provider. Swap DemoProvider for a server-backed one later. */
export interface AssistantProvider {
  name: string;
  isDemo: boolean;
  reply(history: ChatMessage[], signal?: AbortSignal): Promise<string>;
}
