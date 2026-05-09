import type { HostMessage, WebViewMessage } from '../src/protocol';

// acquireVsCodeApi is injected by the VS Code WebView runtime at page load.
// It can only be called once per page — this module holds the singleton.
declare function acquireVsCodeApi(): {
  postMessage(msg: WebViewMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const api = acquireVsCodeApi();

export function postMessage(msg: WebViewMessage): void {
  api.postMessage(msg);
}

export function onMessage(handler: (msg: HostMessage) => void): () => void {
  const listener = (event: MessageEvent) => handler(event.data as HostMessage);
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
