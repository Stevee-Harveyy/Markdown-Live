import * as vscode from 'vscode';
import type { EditorConfig, HostMessage, WebViewMessage } from './protocol';
import { serializeToMarkdown } from './pipeline/serialize';

export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'markdownWysiwyg.editor';

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      MarkdownEditorProvider.viewType,
      new MarkdownEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const cfg = () => vscode.workspace.getConfiguration('markdownWysiwyg');

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview')],
    };
    webviewPanel.webview.html = this.buildHtml(webviewPanel.webview);

    let applyingEdit = false;

    const buildInit = (): HostMessage => ({
      type: 'init',
      text: document.getText(),
      platform: cfg().get<string>('platform', 'gfm'),
      config: {
        spellCheck: cfg().get<boolean>('spellCheck', false),
        syncDelay: cfg().get<number>('syncDelay', 150),
      },
    });

    const msgSub = webviewPanel.webview.onDidReceiveMessage(async (msg: WebViewMessage) => {
      if (msg.type === 'ready') {
        webviewPanel.webview.postMessage(buildInit());
        return;
      }

      if (msg.type === 'transaction') {
        let markdown: string;
        try {
          markdown = serializeToMarkdown(msg.doc as Parameters<typeof serializeToMarkdown>[0]);
        } catch {
          return;
        }

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, fullRange, markdown);
        applyingEdit = true;
        await vscode.workspace.applyEdit(edit);
        applyingEdit = false;
      }
    });

    const changeSub = vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.uri.toString() !== document.uri.toString()) return;
      if (applyingEdit) return;
      const update: HostMessage = { type: 'external_update', text: event.document.getText() };
      webviewPanel.webview.postMessage(update);
    });

    webviewPanel.onDidDispose(() => {
      msgSub.dispose();
      changeSub.dispose();
    });
  }

  private buildHtml(webview: vscode.Webview): string {
    const cfg = vscode.workspace.getConfiguration('markdownWysiwyg');
    const maxWidth = cfg.get<string>('maxWidth', '860px');
    const fontSize = cfg.get<string>('fontSize', 'inherit');
    const lineHeight = cfg.get<number>('lineHeight', 1.6);

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'main.js')
    );
    const nonce = getNonce();

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Live</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: ${fontSize === 'inherit' ? 'var(--vscode-editor-font-size, 14px)' : fontSize};
      line-height: ${lineHeight};
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
    }
    #root {
      max-width: ${maxWidth === 'none' ? '100%' : maxWidth};
      margin: 0 auto;
    }
    .ProseMirror { outline: none; min-height: calc(100vh - 48px); }
    .ProseMirror h1, .ProseMirror h2, .ProseMirror h3,
    .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 { margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.3; }
    .ProseMirror p { margin: 0 0 0.75em; }
    .ProseMirror pre { background: var(--vscode-textCodeBlock-background, #f6f8fa); padding: 12px 16px; border-radius: 6px; overflow-x: auto; }
    .ProseMirror code { font-family: var(--vscode-editor-font-family, Consolas, monospace); font-size: 0.875em; background: var(--vscode-textCodeBlock-background, #f6f8fa); padding: 0.1em 0.3em; border-radius: 3px; }
    .ProseMirror pre code { background: none; padding: 0; }
    .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    .ProseMirror th, .ProseMirror td { border: 1px solid var(--vscode-panel-border, #d0d7de); padding: 6px 13px; }
    .ProseMirror th { background: var(--vscode-textCodeBlock-background, #f6f8fa); font-weight: 600; }
    .ProseMirror blockquote { margin: 0 0 0.75em; padding: 0 1em; border-left: 4px solid var(--vscode-panel-border, #d0d7de); color: var(--vscode-descriptionForeground, #666); }
    .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0 0 0.75em; }
    .ProseMirror li { margin: 0.25em 0; }
    .ProseMirror img { max-width: 100%; }
    .ProseMirror hr { border: none; border-top: 1px solid var(--vscode-panel-border, #d0d7de); margin: 1.5em 0; }
    .ProseMirror a { color: var(--vscode-textLink-foreground, #0969da); text-decoration: none; }
    .ProseMirror a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) nonce += chars[Math.floor(Math.random() * chars.length)];
  return nonce;
}
