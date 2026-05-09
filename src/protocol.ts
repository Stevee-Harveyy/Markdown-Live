// Shared message types for the host ↔ WebView postMessage bus.

export type EditorConfig = {
  spellCheck: boolean;
  syncDelay: number;
};

export type HostMessage =
  | { type: 'init'; text: string; platform: string; config: EditorConfig }
  | { type: 'external_update'; text: string };

export type WebViewMessage =
  | { type: 'ready' }
  | { type: 'transaction'; doc: unknown };
