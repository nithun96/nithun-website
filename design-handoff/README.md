# Handoff: nithun.no Redesign

## Overview
A full visual identity redesign for nithun.no — a personal website for Nithun Manoharan, a product manager based in Oslo. The site has five views: Home, Writing list, Writing post, Silence (sound therapy tool), and Shelf (Books / Series / Games). Dark mode is the default.

## About the Design Files
The files in this bundle are **high-fidelity design references created in HTML** — interactive prototypes showing intended look, layout, and behavior. They are **not** production code to copy directly. The task is to recreate these designs in the target codebase (React 19 + Vite + Tailwind CSS v4, as specified) using its established patterns and libraries. Treat the HTML file as the source of truth for visual appearance and interaction behavior.

## Fidelity
**High-fidelity.** The prototype uses the exact color tokens, typography, spacing, and interactions intended for production. Recreate pixel-precisely, including hover states, transitions, and the Web Audio API sound engine in the Silence tool.

---

## Screens / Views

### 1. Home (Hero)
**Purpose:** Personal landing — name, location, intro, section teasers.

**Layout:**
- Full-width sticky nav (56px height), then a two-column hero grid (`1fr 220px`), then a three-column section teaser grid below a horizontal rule.
- Page shell: `padding: 0 clamp(24px, 5vw, 80px)`, `max-width: 940px`, `margin: 0 auto`.
- Hero top padding: `clamp(64px, 10vh, 120px)`.

**Components:**
- **Name:** `font-family: Georgia, serif; font-size: clamp(32px, 5vw, 52px); font-weight: normal; color: #E8DFC8 (dark) / #2A2218 (light); line-height: 1.15; letter-spacing: -0.01em`
- **Location line:** `font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #9A8E7E`. Preceded by a 16px horizontal rule in the same color.
- **Intro paragraph:** `font-size: 17px; line-height: 1.75; color: #B8B0A0 (dark) / #5A5040 (light); font-weight: 300; max-width: 560px`
- **Teaser quote:** Georgia serif, 15px, italic, `color: #9A8E7E`, left border `2px solid rgba(#C4A882, 0.5)`, `padding-left: 16px`
- **Portrait placeholder:** 200×240px, `background: #2A2620`, warm radial gradient overlay, monospace label text
- **Section teasers:** Three equal columns divided by 1px borders (`color-mix(in oklch, #E8DFC8 8%, transparent)`). Each has a colour-coded uppercase tag (11px, letter-spacing 0.14em), a Georgia serif title (17px, `color: #B8B0A0`), and a description (13px, `color: #9A8E7E`). Tag colours: Writing → `#7090B0`, Silence → `#8FAF6E`, Books → `#E8D49A`.

---

### 2. Writing List
**Purpose:** Editorial index of essays.

**Layout:**
- Page header (`padding: 56px 0 48px`) with page title + subtitle, then a `<ul>` list.
- Each list item: CSS grid `80px 1fr`, `gap: 24px`, `padding: 32px 0`, separated by 1px border.

**Components:**
- **Date column:** `font-size: 12px; color: #9A8E7E; letter-spacing: 0.04em; font-variant-numeric: tabular-nums`
- **Title:** Georgia serif, 20px, `color: #B8B0A0`, transitions to `#E8DFC8` on hover
- **Summary:** 14px, `color: #9A8E7E`, `line-height: 1.6`, `max-width: 560px`
- **Tags:** 10px uppercase, `letter-spacing: 0.1em`, `border: 1px solid rgba(#9A8E7E, 0.35)`, `padding: 2px 7px`, `border-radius: 2px`

---

### 3. Writing Post
**Purpose:** Full reading view for an individual essay.

**Layout:**
- `max-width: 780px` for all content.
- Post header `padding: 64px 0 48px`, border-bottom, then body text.

**Components:**
- **Back button:** 12px uppercase, `letter-spacing: 0.08em`, `color: #9A8E7E`, prefixed with `←`, hover → `#E8DFC8`
- **Post title:** Georgia, `clamp(26px, 4.5vw, 44px)`, normal weight, `line-height: 1.25`
- **Meta row:** 12px, `color: #9A8E7E`, `letter-spacing: 0.04em`, dot-separated
- **Body text:** 17px, `line-height: 1.82`, `color: #B8B0A0`, `font-weight: 300`
- **Body h2:** Georgia, 22px, normal weight, `color: #E8DFC8`, `margin: 2.5em 0 0.8em`
- **Blockquote:** `border-left: 2px solid rgba(#C4A882, 0.5)`, `padding: 4px 0 4px 24px`, italic, 16px
- **Mastodon link:** post footer, 13px, `color: #9A8E7E`, chat-bubble SVG icon, subtle — not a call to action

---

### 4. Silence Tool
**Purpose:** Tinnitus/sleep sound therapy. Four playable sound cards, volume slider, sleep timer, charity note.

**Layout:**
- `padding: 64px 0 80px`
- Sound cards: 2-column CSS grid, `gap: 16px`, `max-width: 640px`
- Controls panel: `max-width: 400px`, `padding: 32px`, `background: #2A2620`, `border-radius: 4px`
- Charity block: `max-width: 500px`, olive-tinted background (`color-mix(in oklch, #5C6B3A 8%, #2A2620)`)

**Sound cards:**
- `background: #2A2620`, `border: 1px solid`, `border-radius: 4px`, `padding: 32px 28px`, `min-height: 140px`
- Inactive border: `color-mix(in oklch, #E8DFC8 7%, transparent)`
- Playing border: `color-mix(in oklch, #8FAF6E 50%, transparent)`
- Hover: `translateY(-1px)`, border darkens
- Each card has a unique radial gradient overlay (opacity 0 → 1 on hover/play): Brown → warm stone tint, Pink → wheat tint, Rain → dusty blue tint, Ocean → sage tint
- Sound name: Georgia serif, 18px
- Description: 12px, `color: #9A8E7E`
- Playing state: animated equaliser bars (4 bars, sage green, CSS keyframe animation)

**Web Audio Engine:**
Four noise types generated via Web Audio API (no external files):
- **Brown noise:** Low-pass filtered random walk — deep rumble
- **Pink noise:** 6-coefficient filter for 1/f spectrum
- **Rain:** White noise with slow amplitude modulation
- **Ocean:** White noise gated by a slow sine wave

All loop seamlessly from a 4-second buffer.

**Controls:**
- Volume: `<input type="range">`, custom styled (2px track, 14px thumb, no browser chrome)
- Sleep timer: Off / 15 / 30 / 45 / 60 min — pill buttons, active state `border-color: rgba(#E8DFC8, 0.35)`

---

### 5. Shelf
**Purpose:** Personal media consumption log across three categories — Books, TV Series, Video Games.

**Layout:**
- Page header, then category tabs row, then status filter pills row, then a card grid.
- Grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 24px 20px`

**Category tabs:**
- Three tabs: Books / Series / Games
- `font-size: 13px`, `color: #9A8E7E` inactive, `color: #E8DFC8` active
- Active underline: `border-bottom: 2px solid` — Books → `#E8D49A`, Series → `#7090B0`, Games → `#8FAF6E`
- Switching category resets the status filter to "All"

**Status filters (pill buttons):**
- All / Currently / Finished / Want to
- `font-size: 11px`, uppercase, `letter-spacing: 0.08em`, `border-radius: 2px`
- Active: subtle background `color-mix(in oklch, #E8DFC8 5%, transparent)`, stronger border

**Item cards — all types:**
- Cover placeholder with 4px left spine; spine colour cycles through palette (8 colours: dusty, stone, sage, wheat, navy, olive, honey, dusty-dim)
- Title: Georgia serif, 13px, `color: #B8B0A0`
- Subtitle (author / platform): 11px, `color: #9A8E7E`
- Status meta row: 5px coloured dot + status label + optional detail. Dot colours: Currently → `#8FAF6E` (sage), Finished → `rgba(#9A8E7E, 0.45)`, Want to → `rgba(#E8D49A, 0.5)`

**Cover aspect ratios by category:**
- Books: `aspect-ratio: 2/3`
- Series: `aspect-ratio: 3/4`
- Games: `aspect-ratio: 4/3`

**Empty state:** Full-width, `padding: 48px 0`, Georgia italic, `color: #9A8E7E`, text: "Nothing here yet."

---

## Navigation
- Sticky, 56px tall, `border-bottom: 1px solid rgba(#E8DFC8, 8%)`
- **Wordmark (NM):** Georgia, 15px, `color: #B8B0A0` (not full white — blends into nav), `background: none; border: none`
- **Nav links:** 13px uppercase, `letter-spacing: 0.06em`, `color: #B8B0A0`. Active/hover: colour transitions to `#E8DFC8` + animated underline (`transform: scaleX(0 → 1)` from left). Active underline colour matches section: Writing → `#7090B0`, Silence → `#8FAF6E`, Shelf → `#FAEDCB` (honey cream). Nav label is **Shelf**, not Books.
- **Controls:** Dark/light toggle + language toggle (NO), styled as small bordered pills (`font-size: 11px`, `border-radius: 2px`, `color: #9A8E7E`)

---

## Footer
- `border-top: 1px solid rgba(#E8DFC8, 8%)`, `padding: 32px`
- Left: "Last updated April 2025" — 11px, `color: #9A8E7E`
- Right: GitHub · CC BY-NC 4.0 · RSS — same style, hover → `#B8B0A0`

---

## Interactions & Behavior

| Interaction | Behavior |
|---|---|
| Nav link click | Instant page swap with `fadeUp` animation (opacity 0→1, translateY 12px→0, 0.4s ease) |
| Writing item click | Navigate to post view, passing post data |
| Post back button | Return to writing list |
| Section teaser click | Navigate to that section |
| Sound card click | Toggle play/pause; only one sound plays at a time |
| Volume slider | Updates gain node in real time |
| Sleep timer | Select timer duration (UI only in prototype; wire up `setTimeout` + `noiseEngine.stop()` in production) |
| Book filter | Filters grid instantly, no animation needed |
| Theme toggle | Swaps `data-theme` attribute on `<html>`; all colors transition via CSS `transition: background 0.2s, color 0.2s` |

---

## Design Tokens

### Colors — Dark mode (default)
```
--bg:    #1C1A17   /* background primary */
--bg2:   #2A2620   /* background secondary / cards */
--fg:    #E8DFC8   /* text primary */
--fg2:   #B8B0A0   /* text secondary */
--fgm:   #9A8E7E   /* text muted */
```

### Colors — Light mode
```
--bg:    #F5F0E8
--bg2:   #EDE6D8
--fg:    #2A2218
--fg2:   #5A5040
--fgm:   #7A6E5E
```

### Accent Colors (both modes)
```
--olive:  #5C6B3A
--sage:   #8FAF6E
--navy:   #2C3E5C
--dusty:  #7090B0
--stone:  #C4A882
--honey:  #FAEDCB
--wheat:  #E8D49A
```

### Typography
```
Headings:  Georgia, 'Times New Roman', serif
Body:      'DM Sans', sans-serif (Google Fonts, weights 300/400/500)
```

### Spacing / Misc
```
Border radius:   2–4px (subtle, never pill-shaped)
Max content width: 780px (posts), 940px (shell)
Nav height:      56px
Page padding:    clamp(24px, 5vw, 80px) horizontal
```

### Grain texture
A subtle SVG fractalNoise grain overlay is applied via `body::before` at `opacity: 0.025` (fixed position, full viewport, `pointer-events: none`, `z-index: 9999`). Use a CSS noise approach or a static PNG grain asset in production.

---

## Assets
- **Portrait:** Placeholder only — replace with a warm, slightly desaturated photo. Suggested treatment: slight warm tone, not clinical.
- **Icons:** No icon library used — SVG inline only where needed (chat bubble for Mastodon link, person outline for portrait placeholder).
- **Fonts:** DM Sans via Google Fonts. Self-host for production.

---

## Files in This Package
| File | Description |
|---|---|
| `nithun.html` | Full interactive prototype — all five views, Web Audio, dark/light mode |

Open `nithun.html` in a browser to interact with the prototype. Use browser DevTools to inspect exact computed values.
