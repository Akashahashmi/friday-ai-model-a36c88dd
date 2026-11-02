export type AssistantState = "idle" | "listening" | "processing" | "speaking" | "error";

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
  muted: boolean;
  reminderSound?: boolean;
}

export const DEFAULT_PREFS: Preferences = {
  animations: true,
  voiceReplies: true,
  uiSounds: true,
  speechRate: 1,
  muted: false,
  reminderSound: true,
};

/** Pluggable response provider. Swap DemoProvider for a server-backed one later. */
export interface AssistantProvider {
  name: string;
  isDemo: boolean;
  reply(history: ChatMessage[], signal?: AbortSignal): Promise<string>;
}
