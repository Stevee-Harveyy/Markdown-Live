"""
Generate a demo GIF for Markdown Live README.
Draws a realistic VS Code-like editor frame showing the WYSIWYG editor
across several "scenes" that simulate typing and interaction.
"""

from PIL import Image, ImageDraw, ImageFont
import os, sys

OUT = os.path.join(os.path.dirname(__file__), '..', 'media', 'demo.gif')
os.makedirs(os.path.dirname(OUT), exist_ok=True)

W, H = 900, 560

# ── Colours (VS Code Dark+ palette) ──────────────────────────────────────────
BG          = (30,  30,  30)
SIDEBAR_BG  = (37,  37,  38)
TAB_BAR_BG  = (37,  37,  38)
TAB_ACTIVE  = (30,  30,  30)
TAB_TEXT    = (204, 204, 204)
TITLE_FG    = (204, 204, 204)
EDITOR_BG   = (30,  30,  30)
CURSOR_COL  = (0,  120, 215)
BORDER      = (68,  68,  68)

H1_COL      = (220, 220, 170)
H2_COL      = (206, 145, 120)
H3_COL      = (156, 220, 254)
BODY_COL    = (204, 204, 204)
BOLD_COL    = (255, 255, 255)
ITALIC_COL  = (206, 145, 120)
CODE_COL    = (206, 145, 120)
CODE_BG     = (40,  40,  40)
LINK_COL    = (79,  193, 255)
STRIKE_COL  = (128, 128, 128)
CHECK_OK    = (78,  201, 176)
CHECK_PEND  = (128, 128, 128)
TABLE_HEAD  = (40,  40,  40)
TABLE_BOR   = (68,  68,  68)
QUOTE_BAR   = (86,  156, 214)
QUOTE_FG    = (150, 150, 150)
BANNER_BG   = (204, 167, 0)
BANNER_FG   = (0,   0,   0)

# ── Font loading (fall back to default if not found) ──────────────────────────
def load_font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
    ]
    bold_candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\calibrib.ttf",
    ]
    sources = bold_candidates if bold else candidates
    for path in sources:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()

def load_mono(size):
    candidates = [
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\cour.ttf",
        r"C:\Windows\Fonts\lucon.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()

FONT_BODY   = load_font(13)
FONT_BOLD   = load_font(13, bold=True)
FONT_H1     = load_font(22, bold=True)
FONT_H2     = load_font(18, bold=True)
FONT_H3     = load_font(15, bold=True)
FONT_MONO   = load_mono(12)
FONT_SMALL  = load_font(11)
FONT_UI     = load_font(12)

# ── Chrome helpers ────────────────────────────────────────────────────────────
def draw_chrome(d: ImageDraw.ImageDraw, filename="sample.md"):
    # Title bar
    d.rectangle([0, 0, W-1, 28], fill=(37, 37, 38))
    d.text((W//2 - 60, 7), f"{filename} — Markdown Live", font=FONT_UI, fill=TITLE_FG)
    # Traffic-light dots
    for x, col in [(12, (255,95,87)), (32, (255,189,46)), (52, (39,201,63))]:
        d.ellipse([x-5, 9, x+5, 19], fill=col)
    # Tab bar
    d.rectangle([0, 28, W-1, 52], fill=TAB_BAR_BG)
    # Active tab
    d.rectangle([0, 28, 150, 52], fill=TAB_ACTIVE)
    d.text((12, 34), f"  {filename}", font=FONT_UI, fill=TAB_TEXT)
    d.line([0, 52, W, 52], fill=BORDER, width=1)
    # Status bar
    d.rectangle([0, H-22, W-1, H-1], fill=(0, 122, 204))
    d.text((8, H-18), "  GFM  |  Markdown Live  |  UTF-8", font=FONT_SMALL, fill=(255,255,255))

CONTENT_TOP = 60   # y offset for content area
LEFT_PAD    = 48

def text_w(d, text, font):
    bb = d.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]

# ── Scene drawing functions ───────────────────────────────────────────────────

def base_image():
    img = Image.new('RGB', (W, H), EDITOR_BG)
    d = ImageDraw.Draw(img)
    draw_chrome(d)
    return img, d

def scene_overview(cursor_on=False):
    """Full document view showing all GFM features rendered."""
    img, d = base_image()
    y = CONTENT_TOP + 8
    x = LEFT_PAD

    # H1
    d.text((x, y), "# Getting Started", font=FONT_H1, fill=H1_COL); y += 32
    # Paragraph
    d.text((x, y), "Edit markdown ", font=FONT_BODY, fill=BODY_COL)
    bx = x + text_w(d, "Edit markdown ", FONT_BODY)
    d.text((bx, y), "naturally", font=FONT_BOLD, fill=BOLD_COL)
    bx += text_w(d, "naturally", FONT_BOLD)
    d.text((bx, y), " — no raw syntax in sight.", font=FONT_BODY, fill=BODY_COL); y += 22

    # H2
    y += 8
    d.text((x, y), "Features", font=FONT_H2, fill=H2_COL); y += 26

    # Task list
    for checked, label in [(True, "True WYSIWYG editing"), (True, "Lossless round-trip via mdast"), (False, "Azure DevOps preset (Phase 4)")]:
        box_x, box_y = x, y+1
        d.rectangle([box_x, box_y, box_x+12, box_y+12], outline=CHECK_OK if checked else CHECK_PEND, width=1)
        if checked:
            d.line([box_x+2, box_y+6, box_x+5, box_y+10, box_x+10, box_y+3], fill=CHECK_OK, width=2)
        d.text((x+18, y), label, font=FONT_BODY, fill=(CHECK_OK if checked else CHECK_PEND))
        y += 20

    # H2
    y += 10
    d.text((x, y), "Quick Example", font=FONT_H2, fill=H2_COL); y += 26

    # Code block
    cb_h = 54
    d.rectangle([x, y, x+520, y+cb_h], fill=CODE_BG)
    d.text((x+8, y+6),  "const greet = (name: string) => {", font=FONT_MONO, fill=CODE_COL)
    d.text((x+8, y+22), "  return `Hello, ${name}!`;",       font=FONT_MONO, fill=CODE_COL)
    d.text((x+8, y+38), "};",                                  font=FONT_MONO, fill=CODE_COL)
    y += cb_h + 14

    # Table
    cols = ["Name", "Role", "Status"]
    rows_data = [("Alice", "Author", "✓ Active"), ("Bob", "Reviewer", "Pending")]
    col_w = [120, 130, 110]
    tx = x
    # Header
    d.rectangle([tx, y, tx + sum(col_w), y+22], fill=TABLE_HEAD)
    cx = tx
    for i, col in enumerate(cols):
        d.text((cx+6, y+4), col, font=FONT_BOLD, fill=BOLD_COL)
        cx += col_w[i]
    d.line([tx, y+22, tx+sum(col_w), y+22], fill=TABLE_BOR, width=1)
    y += 22
    for row in rows_data:
        cx = tx
        for i, cell in enumerate(row):
            d.text((cx+6, y+4), cell, font=FONT_BODY, fill=BODY_COL)
            d.line([cx+col_w[i], y, cx+col_w[i], y+22], fill=TABLE_BOR, width=1)
            cx += col_w[i]
        d.line([tx, y, tx+sum(col_w), y], fill=TABLE_BOR, width=1)
        y += 22
    d.rectangle([tx, CONTENT_TOP+8+32+22+8+26+60+10+26+cb_h+14, tx+sum(col_w), y], outline=TABLE_BOR, width=1)

    if cursor_on:
        d.rectangle([x, y+8, x+2, y+22], fill=CURSOR_COL)

    return img

def scene_typing(text_so_far: str):
    """Paragraph being typed live."""
    img, d = base_image()
    y = CONTENT_TOP + 8
    x = LEFT_PAD

    d.text((x, y), "# Meeting Notes", font=FONT_H1, fill=H1_COL); y += 34
    d.text((x, y), "Date: 2026-05-10", font=FONT_BODY, fill=BODY_COL); y += 26

    d.text((x, y), "## Action Items", font=FONT_H2, fill=H2_COL); y += 26

    for checked, label in [(True, "Review Phase 3 PR"), (True, "Update changelog")]:
        box_x = x
        d.rectangle([box_x, y+1, box_x+12, y+13], outline=CHECK_OK, width=1)
        d.line([box_x+2, y+7, box_x+5, y+11, box_x+10, y+4], fill=CHECK_OK, width=2)
        d.text((x+18, y), label, font=FONT_BODY, fill=BODY_COL)
        y += 20

    y += 10
    d.text((x, y), "## Notes", font=FONT_H2, fill=H2_COL); y += 26
    d.text((x, y), text_so_far, font=FONT_BODY, fill=BODY_COL)
    # blinking cursor after text
    tw = text_w(d, text_so_far, FONT_BODY)
    d.rectangle([x + tw, y, x + tw + 2, y + 16], fill=CURSOR_COL)
    return img

def scene_table_editing():
    """Close-up of a table being edited."""
    img, d = base_image()
    y = CONTENT_TOP + 8
    x = LEFT_PAD

    d.text((x, y), "## Comparison", font=FONT_H2, fill=H2_COL); y += 28

    cols = ["Feature", "Markdown Live", "Plain Preview"]
    col_w = [180, 150, 150]
    rows_data = [
        ("WYSIWYG editing", "✓", "✗"),
        ("Lossless round-trip", "✓", "✗"),
        ("External sync", "✓", "–"),
        ("Task list toggle", "✓", "✗"),
    ]
    tx = x
    d.rectangle([tx, y, tx + sum(col_w), y+22], fill=TABLE_HEAD)
    cx = tx
    for i, col in enumerate(cols):
        d.text((cx+6, y+4), col, font=FONT_BOLD, fill=BOLD_COL)
        cx += col_w[i]
    d.line([tx, y+22, tx+sum(col_w), y+22], fill=TABLE_BOR, width=1)
    y_start = y
    y += 22

    highlight_row = 1  # "Lossless round-trip" is being edited
    for ri, row in enumerate(rows_data):
        if ri == highlight_row:
            d.rectangle([tx, y, tx+sum(col_w), y+22], fill=(50, 60, 50))
        cx = tx
        for i, cell in enumerate(row):
            col_fill = CHECK_OK if cell == "✓" else (205, 80, 80) if cell == "✗" else BODY_COL
            font = FONT_BOLD if i == 0 else FONT_BODY
            d.text((cx+6, y+4), cell, font=font, fill=col_fill if i > 0 else BODY_COL)
            d.line([cx+col_w[i], y, cx+col_w[i], y+22], fill=TABLE_BOR, width=1)
            cx += col_w[i]
        d.line([tx, y, tx+sum(col_w), y], fill=TABLE_BOR, width=1)
        y += 22
    d.rectangle([tx, y_start, tx+sum(col_w), y], outline=TABLE_BOR, width=1)

    # Cursor in highlight row col 1
    d.rectangle([tx + col_w[0] + text_w(d, "✓", FONT_BODY) + 8, y_start+22+22+4,
                 tx + col_w[0] + text_w(d, "✓", FONT_BODY) + 10, y_start+22+22+18], fill=CURSOR_COL)
    return img

def scene_external_banner():
    """Shows the external-change banner."""
    img = scene_overview()
    d = ImageDraw.Draw(img)
    # banner
    d.rectangle([0, 52, W, 52+28], fill=BANNER_BG)
    d.text((12, 58), "File changed externally", font=FONT_UI, fill=BANNER_FG)
    bw1 = 88
    bw2 = 100
    bx = W - bw2 - bw1 - 24
    d.rectangle([bx, 56, bx+bw1, 56+18], fill=(255,255,255,180), outline=(0,0,0,80), width=1)
    d.text((bx+8, 58), "Keep mine", font=FONT_SMALL, fill=BANNER_FG)
    bx2 = bx + bw1 + 8
    d.rectangle([bx2, 56, bx2+bw2, 56+18], fill=(255,255,255,180), outline=(0,0,0,80), width=1)
    d.text((bx2+6, 58), "Accept theirs", font=FONT_SMALL, fill=BANNER_FG)
    return img

def scene_frontmatter():
    """Shows YAML frontmatter as a read-only raw block."""
    img, d = base_image()
    y = CONTENT_TOP + 8
    x = LEFT_PAD

    # Raw block for frontmatter
    block_h = 64
    d.rectangle([x, y, x+540, y+block_h], fill=CODE_BG)
    d.rectangle([x, y, x+540, y+block_h], outline=(80, 80, 80), width=1)
    # dashed border feel via corners
    d.text((x+8, y+6),  "---",           font=FONT_MONO, fill=(128, 128, 128))
    d.text((x+8, y+22), "title: Getting Started", font=FONT_MONO, fill=(128, 128, 128))
    d.text((x+8, y+38), "date: 2026-05-10",       font=FONT_MONO, fill=(128, 128, 128))
    d.text((x+8, y+54-6), "---",         font=FONT_MONO, fill=(128, 128, 128))
    # label
    d.text((x+544, y+24), "read-only", font=FONT_SMALL, fill=(100, 100, 100))
    y += block_h + 16

    d.text((x, y), "# Getting Started", font=FONT_H1, fill=H1_COL); y += 32
    d.text((x, y), "This document has frontmatter preserved through", font=FONT_BODY, fill=BODY_COL); y += 20
    d.text((x, y), "every edit — it ", font=FONT_BODY, fill=BODY_COL)
    ox = x + text_w(d, "every edit — it ", FONT_BODY)
    d.text((ox, y), "never", font=FONT_BOLD, fill=BOLD_COL)
    ox += text_w(d, "never", FONT_BOLD)
    d.text((ox, y), " gets rewritten.", font=FONT_BODY, fill=BODY_COL)

    return img


# ── Build frames ──────────────────────────────────────────────────────────────

TYPING_SENTENCES = [
    "Discussed release timeline",
    "Discussed release timeline for",
    "Discussed release timeline for v0.1.",
    "Discussed release timeline for v0.1. Team agreed",
    "Discussed release timeline for v0.1. Team agreed on Phase 4 scope.",
]

frames = []
durations = []

def add(img, ms):
    frames.append(img.convert('P', palette=Image.ADAPTIVE, colors=256))
    durations.append(ms)

# Scene 1: overview, hold
for _ in range(3):
    add(scene_overview(cursor_on=False), 600)
add(scene_overview(cursor_on=True), 400)

# Scene 2: typing animation
for i, txt in enumerate(TYPING_SENTENCES):
    add(scene_typing(txt), 220 if i < len(TYPING_SENTENCES)-1 else 800)

# Scene 3: table editing
for _ in range(4):
    add(scene_table_editing(), 500)

# Scene 4: frontmatter / raw block
for _ in range(3):
    add(scene_frontmatter(), 600)

# Scene 5: external-change banner
for _ in range(3):
    add(scene_external_banner(), 600)

# Scene 6: back to overview
for _ in range(2):
    add(scene_overview(), 700)

# ── Save ──────────────────────────────────────────────────────────────────────
frames[0].save(
    OUT,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    optimize=False,
)
print(f"Saved {OUT}  ({len(frames)} frames)")
