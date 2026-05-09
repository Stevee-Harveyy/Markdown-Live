# Markdown Live

A VS Code extension that lets you edit `.md` files directly in the rendered view — no raw source required. What you see is what you get: type into headings, paragraphs, and lists, and your changes flow back to the markdown source in real time.

---

## Features

- **WYSIWYG editing** — edit formatted text without ever looking at raw markdown syntax
- **Lossless round-trip** — changes are written back through ProseMirror → mdast → remark-stringify, never through HTML conversion
- **VS Code native** — dirty indicator, Ctrl+S, and Ctrl+Z work exactly as expected
- **Live sync** — external changes to the file (git pull, another editor) reload the view automatically

---

## Installation

### From a `.vsix` file

1. Download `markdown-live-x.x.x.vsix` from the [Releases](../../releases) page
2. Open VS Code
3. Open the Command Palette (`Ctrl+Shift+P`) → **Extensions: Install from VSIX…**
4. Select the downloaded file

Or from the terminal:

```bash
code --install-extension markdown-live-x.x.x.vsix
```

### Opening a file

Once installed, opening any `.md` file will automatically use Markdown Live. To fall back to the raw text editor, right-click the file in the Explorer → **Open With… → Text Editor**.

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [VS Code](https://code.visualstudio.com) 1.85+

### Setup

```bash
git clone https://github.com/Stevee-Harveyy/Markdown-Live.git
cd Markdown-Live
npm install
```

### Build

```bash
# One-shot build (extension host + WebView bundle)
npm run compile

# Watch mode — run both in separate terminals
npm run watch:ext   # esbuild watch (extension host)
npm run watch:web   # Vite watch (WebView)
```

### Run in development

Press **F5** in VS Code to launch an Extension Development Host with the extension loaded. Open any `.md` file to test.

### Tests

```bash
npm test            # Vitest unit + property tests
npm run test:int    # VS Code integration tests
```

### Package

```bash
npx @vscode/vsce package --no-dependencies --allow-missing-repository
```

---

## Architecture

The extension uses VS Code's `CustomTextEditor` API so file lifecycle (dirty state, save, undo/redo) is handled by VS Code itself.

```
.md file → remark-parse → mdast → mdastToTiptap → TipTap editor (WebView)
                                                          │
                                              (edits, debounced 150ms)
                                                          │
.md file ← remark-stringify ← mdast ← serializeToMarkdown ← TipTap JSON
```

The WebView and extension host communicate over a typed postMessage bus defined in `src/protocol.ts`.

---

## License

MIT
