// Shared message types for the host ↔ WebView postMessage bus.
// Import with `import type` from both host and webview-src to keep the
// bundle clean — these are erased at compile time.

export type HostMessage =
  | { type: 'init'; text: string; platform: string }
  | { type: 'external_update'; text: string };

export type WebViewMessage =
  | { type: 'ready' }
  | { type: 'transaction'; doc: unknown };
