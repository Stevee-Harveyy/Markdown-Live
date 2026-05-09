# Markdown Live

[![GitHub Release](https://img.shields.io/github/v/release/Stevee-Harveyy/Markdown-Live?label=latest&color=blue)](https://github.com/Stevee-Harveyy/Markdown-Live/releases/latest)

**Edit markdown the way it looks, not the way it's written.**

Markdown Live opens `.md` files directly in their rendered form. Type into headings, paragraphs, lists, and links — your changes write back to the markdown source in real time. No toggling between source and preview, no raw syntax in sight.

---

## Getting started

1. Download `markdown-live-x.x.x.vsix` from the [latest release](https://github.com/Stevee-Harveyy/Markdown-Live/releases/latest)
2. In VS Code: **Extensions** (`Ctrl+Shift+X`) → **`···`** menu → **Install from VSIX…**
3. Open any `.md` file — Markdown Live loads automatically

Or via terminal:
```bash
code --install-extension markdown-live-x.x.x.vsix
```
> **Note:** The `code` command must be in your PATH. In VS Code, run **Shell Command: Install 'code' command in PATH** from the Command Palette if needed.

---

## Features

- **True WYSIWYG** — write in rendered markdown; never look at raw syntax
- **Lossless round-trip** — edits travel through ProseMirror → mdast → remark-stringify, not through HTML conversion, so nothing is lost or reformatted unexpectedly
- **Feels like a normal editor** — dirty indicator, Ctrl+S, Ctrl+Z, and multi-cursor all work as expected
- **Live reload** — external changes to the file (git pull, another tool writing to it) update the view automatically

---

## Settings

All settings are under **Extensions → Markdown Live** in VS Code Settings (`Ctrl+,`), or add them directly to `settings.json`.

### Editor behaviour

| Setting | Type | Default | Description |
|---|---|---|---|
| `markdownWysiwyg.syncDelay` | number | `150` | Milliseconds to wait after the last keystroke before writing changes back to the source file. Lower values sync faster; higher values reduce disk writes during fast typing. |
| `markdownWysiwyg.spellCheck` | boolean | `false` | Enable browser spell checking in the editor. Underlines misspelled words using the OS dictionary. |

### Appearance

| Setting | Type | Default | Description |
|---|---|---|---|
| `markdownWysiwyg.maxWidth` | string | `"860px"` | Maximum width of the content area. Accepts any CSS length — `720px`, `90ch`, `100%`. Set to `none` for full width. |
| `markdownWysiwyg.fontSize` | string | `"inherit"` | Font size for rendered content, e.g. `16px` or `1.1rem`. `inherit` follows VS Code's editor font size setting. |
| `markdownWysiwyg.lineHeight` | number | `1.6` | Line height multiplier. Useful for adjusting reading comfort. Valid range: `1.0` – `3.0`. |

### Markdown flavour

| Setting | Type | Default | Description |
|---|---|---|---|
| `markdownWysiwyg.platform` | string | `"gfm"` | Markdown flavour for parsing and serialization. Currently `gfm` (GitHub Flavored Markdown). Additional presets — `azure-devops`, `gitlab` — are in development. |

### Example `settings.json`

```json
{
  "markdownWysiwyg.maxWidth": "760px",
  "markdownWysiwyg.fontSize": "15px",
  "markdownWysiwyg.lineHeight": 1.7,
  "markdownWysiwyg.syncDelay": 300,
  "markdownWysiwyg.spellCheck": true
}
```

---

## Switching editors

Markdown Live registers as the **default editor** for `.md` files. To open a file in the plain text editor instead, right-click it in the Explorer → **Open With… → Text Editor**.

To permanently change which editor opens `.md` files by default, add this to your `settings.json`:

```json
// Use Markdown Live by default
"workbench.editorAssociations": {
  "*.md": "markdownWysiwyg.editor"
}

// Or revert to the plain text editor
"workbench.editorAssociations": {
  "*.md": "default"
}
```

---

## Contributing

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [VS Code](https://code.visualstudio.com) 1.85+

### Setup

```bash
git clone https://github.com/Stevee-Harveyy/Markdown-Live.git
cd Markdown-Live
npm install
```

### Development workflow

```bash
npm run compile       # one-shot build
npm run watch:ext     # watch extension host (esbuild)
npm run watch:web     # watch WebView bundle (Vite)
```

Press **F5** to launch an Extension Development Host with the extension loaded.

```bash
npm test              # unit + property tests (Vitest)
npm run test:int      # VS Code integration tests
npm run package       # build and package as .vsix
```

### Releasing

1. Bump `version` in `package.json`
2. `git commit -am "chore: vX.Y.Z"`
3. `git tag vX.Y.Z && git push origin main --tags`

GitHub Actions builds the `.vsix` and publishes a GitHub Release automatically.

---

## How it works

Markdown Live uses VS Code's `CustomTextEditor` API, which means VS Code itself manages the file lifecycle — dirty state, save, undo/redo, conflict detection — with no custom implementation needed.

```
.md  ──remark-parse──▶  mdast  ──mdastToTiptap──▶  TipTap editor
                                                          │
                                                  edit (150 ms debounce)
                                                          │
.md  ◀──remark-stringify──  mdast  ◀──serialize──  TipTap JSON
```

The WebView and extension host communicate over a typed message bus ([`src/protocol.ts`](src/protocol.ts)).

---

## License

[MIT](LICENSE)
