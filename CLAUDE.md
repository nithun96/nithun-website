# CLAUDE.md – Nithun Manoharan Personal Website

This file is the memory and rulebook for this project. Read it at the start of every session.

---

## Who I Am

My name is **Nithun Manoharan**. I am a Product Manager specializing in AI and Data Analytics, based in Norway. I am not a professional developer – I know enough HTML/CSS to tweak individual lines, but I rely on you (Claude Code) to write and structure the code. I want to understand what I'm building, but I don't need line-by-line explanations unless I ask.

I have a larger personal mission around climate, nature, and spreading unbiased information. This website is the first step.

---

## Project Goal

Build a **personal website** that:
- Establishes my personal brand online
- Ranks well on Google for the name "Nithun Manoharan" (SEO priority)
- Is **accessible** (WCAG AA compliant)
- Is **creative and bold** in design – not a generic template
- Is a **learning project** for me to understand React and modern frontend development
- Launches by **April 6, 2026**

This is **not** a CV or portfolio. It is a personal brand and identity site.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **React + Vite** | Fast, modern, great learning base |
| Styling | **Tailwind CSS** | Utility-first, widely used, easy to customize |
| Routing | **React Router** | Good to learn even on a single-page site |
| i18n | **react-i18next** | Multi-language support (EN primary, NO secondary) |
| Analytics | **Plausible Analytics** | Privacy-friendly, lightweight |
| Hosting | **Hetzner VPS** | Self-hosted, full control |
| Web server | **Nginx** | Serve the built React app |
| Version control | **Git + GitHub** | Push code here for backup and deployment |

---

## Design Principles

- **Tone:** Creative and bold. Not corporate. Not generic. Visually distinctive.
- **Theme:** Both dark and light mode, with a toggle. Dark mode as default.
- **Typography:** Serif for headings (e.g. Lora or Playfair Display), sans-serif for body (e.g. Inter)
- **Colors:** A neutral dark/light base with 1–2 strong accent colors. Avoid clichéd tech blues.
- **No interactive elements in v1** – no animations, no hover effects that serve no purpose, no JS tricks
- **Mobile-first** – design for small screen first, then scale up
- **Generous whitespace** – clean, not cluttered

---

## Site Structure (v1)

### 1. Hero / Intro
- Full name: **Nithun Manoharan** as `<h1>`
- Short, honest, non-cliché tagline (not "passionate about innovation")
- Brief personal intro: who I am beyond my job title

### 2. What I Care About *(optional in v1, placeholder OK)*
- Values around climate, unbiased information, helping people
- Can be short – a few sentences or a pull quote

### 3. Books & Music I Love
- A curated, personal list – not exhaustive
- Books: mix of genres, no need to categorize by field
- Music: honest picks that say something about who I am
- No star ratings or complex UI – just clean lists

### 4. Contact / Links
- **LinkedIn** link
- **GitHub** link (even if sparse for now)
- Email (optional – decide before launch)
- Simple, friendly tone: "Let's connect" or similar

---

## SEO Requirements

- `<title>`: `Nithun Manoharan | Product Manager, AI & Data Analytics`
- `<meta name="description">`: Written to rank for name-based searches, human-sounding
- `<h1>` must contain full name on every page
- Add **JSON-LD Person schema** in `<head>` for Google Knowledge Panel eligibility
- Language attribute on `<html>`: `lang="en"` (or dynamic based on selected language)
- All images must have descriptive `alt` text
- Semantic HTML: use `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>` correctly

---

## Accessibility Requirements (WCAG AA)

- Color contrast minimum **4.5:1** for body text, **3:1** for large text
- All interactive elements (including dark/light toggle) keyboard-navigable
- Use `aria-label` on icon-only buttons
- Skip-to-content link at top of page for screen readers
- No content that depends solely on color to convey meaning

---

## Internationalization (i18n)

- Use **react-i18next** from the start
- English (`en`) is the primary language
- Norwegian (`no`) is the secondary language
- All user-facing text strings must be in translation files, never hardcoded
- Language toggle in the navigation
- Translation files location: `src/locales/en/translation.json` and `src/locales/no/translation.json`

---

## Folder Structure

```
nithun-website/
├── index.html                      # Entry point — SEO meta, Open Graph, JSON-LD, dark mode init
├── vite.config.js                  # Vite config — React plugin, Tailwind plugin, build date injection
├── deploy.sh                       # Deploy: build → scp to server → git commit + push
├── scripts/
│   └── generate-sitemap.js         # Auto-generates public/sitemap.xml at build time
├── public/
│   ├── favicon.svg                 # Custom NM favicon
│   ├── sitemap.xml                 # Generated at build time — do not edit manually
│   ├── fonts/                      # Self-hosted DM Sans WOFF2 files (see Fonts section)
│   └── images/about/               # About page photos — portrait, flower field, 6 travel shots (webp)
└── src/
    ├── main.jsx                    # Bootstrap — BrowserRouter + i18n init
    ├── App.jsx                     # Root layout — Navbar, Routes, Footer
    ├── i18n.js                     # i18next config — EN/NO, language detection
    ├── styles/
    │   ├── global.css              # Tailwind import, dark mode variant, CSS custom properties
    │   └── shell.js                # Shared page width/padding constants (SHELL) — keeps Navbar/pages/Footer aligned
    ├── components/
    │   ├── Navbar.jsx              # Navigation bar — NM logo, nav links, ThemePill + LangPill toggles (two-row mobile)
    │   ├── Footer.jsx              # Footer — Pyre logo, GitHub, CC license, build date
    │   ├── PyreMark.jsx            # Pyre triangle SVG logo — used in Hero subtitle and Footer
    │   ├── ThemeToggle.jsx         # UNUSED — functionality folded into Navbar.jsx as ThemePill
    │   └── LangToggle.jsx          # UNUSED — functionality folded into Navbar.jsx as LangPill
    ├── sections/
    │   └── Hero.jsx                # Home page — name, location, intro, teaser, section teasers
    ├── pages/
    │   ├── AboutPage.jsx           # /about — bio, portrait, travel photography grid
    │   ├── ShelfPage.jsx           # /shelf — books/games/TV with cover art and status filters
    │   ├── SilencePage.jsx         # /silence — tinnitus noise tool with sleep timer
    │   ├── WritingPage.jsx         # /writing — list of markdown posts
    │   └── WritingPostPage.jsx     # /writing/:slug — individual post renderer
    ├── audio/
    │   └── noiseEngine.js          # Web Audio API noise engine (brown, pink, rain, ocean)
    ├── data/
    │   ├── shelf.json              # Shelf content — 59 books, 50 games, 9 TV entries
    │   └── charities.json          # Charity links shown on Silence page
    ├── lib/
    │   ├── parseFrontmatter.js     # Parses YAML frontmatter from .md writing files
    │   └── parseFootnotes.js       # Strips inline footnote syntax from post body, returns {body, footnotes[]}
    ├── utils/
    │   └── bookCovers.js           # Cover art — Google Books (primary), Open Library (fallback)
    ├── writing/
    │   └── *.md                    # Writing posts — YAML frontmatter + markdown body
    │                               # Frontmatter fields:
    │                               #   title, date, slug, summary, mastodon (all standard)
    │                               #   language: "en" | "no" (defaults to "en" if absent)
    │                               #   spotify: full Spotify URL (optional) — renders embed at post bottom
    └── locales/
        ├── en/translation.json     # English strings
        └── no/translation.json     # Norwegian strings
```

---

## Fonts

DM Sans is self-hosted in `public/fonts/` — **do not use Google Fonts**.

Files:
- `public/fonts/dm-sans-latin.woff2` — normal, weights 300–500, latin
- `public/fonts/dm-sans-latin-ext.woff2` — normal, weights 300–500, latin-ext
- `public/fonts/dm-sans-italic-latin.woff2` — italic, weights 300–500, latin
- `public/fonts/dm-sans-italic-latin-ext.woff2` — italic, weights 300–500, latin-ext

`@font-face` declarations are in `src/styles/global.css`. The Nginx CSP has `font-src 'self'` only — no external font domains allowed.

If adding new weights or styles: download the WOFF2 from fonts.gstatic.com (fetch the Google Fonts CSS with a Chrome User-Agent to get WOFF2 URLs), save to `public/fonts/`, and add the corresponding `@font-face` block in `global.css`.

---

## Deployment (Hetzner)

To deploy changes, use the deploy script with a commit message:

```
./deploy.sh "Your commit message"
```

This will build, upload to the server, and push to GitHub in one command.

The site is live at **nithun.no** (primary domain). Traffic from nithunmanoharan.com automatically redirects to nithun.no.

**Important:** After every change session, run `./deploy.sh` with a descriptive commit message to deploy to the live server.

**After every deploy:** Update `README.md` to reflect the current state of the site — pages, routes, file structure, and the "What's Live" checklist. The README is the living reference for what exists; keep it accurate.

---

## Book Covers (Shelf Page)

Covers are pre-fetched at dev-time and stored in `src/data/bookCovers.json` (committed to git). The app imports this file statically — no API calls at runtime.

### Workflow (run when adding books or a cover looks wrong)

1. **`npm run fetch-covers`** — queries Google Books API then Open Library for each book, validates images (width ≥ 200px), writes:
   - `src/data/bookCovers.draft.json` (gitignored, intermediate)
   - `cover-preview.html` (gitignored) — open in browser to review all covers visually
2. Open `cover-preview.html`. For any cover that's wrong or missing:
   - Add an entry to `src/data/bookCoversOverride.json` using the **exact book title** from `shelf.json`
   - Set value to a direct image URL (string) to override, or `null` to leave the card without a cover
3. **`npm run finalise-covers`** — merges draft + overrides → writes `src/data/bookCovers.json`
4. Commit `src/data/bookCovers.json` and `src/data/bookCoversOverride.json`
5. Deploy: `./deploy.sh "Update book covers"`

### Google Books API key (optional but recommended)
```
$env:GOOGLE_BOOKS_API_KEY="your-key-here"; npm run fetch-covers
```
Without a key the script still works but may encounter rate limits. Get a free key at console.cloud.google.com (Books API, no billing required for reasonable use).

---

## Cover Art for Games & TV (planned — do this in VS Code / local Claude Code)

Games and TV/Anime cards currently show text only — no cover image at all (unlike Books, which has `bookCovers.json`). This can't be built from a cloud session: the API domains below are blocked by that environment's network policy, and no session should have real API keys pasted into chat. Do this locally, where you already have unrestricted network access and can hold the keys yourself.

### Sources
- **Games → RAWG** (api.rawg.io). Free API key, broad coverage including retro/console titles (needed for things like GBA-era Pokémon). Sign up at rawg.io/apidocs.
- **TV/Anime → TMDB** (api.themoviedb.org). Free API key, covers both Western/Korean shows and anime-as-TV-shows under one API — no need for a second source. Sign up at themoviedb.org/settings/api.

Alternatives considered: SteamGridDB (games — nicer curated "grid" art style, but less retro coverage, still needs a key) and AniList (anime only, keyless, but doesn't cover the 4 non-anime TV entries — would still need TMDB alongside it, so no simpler than TMDB alone).

### Plan (mirrors the existing Book Covers workflow above)
1. Get free API keys from RAWG and TMDB; set as env vars locally (`RAWG_API_KEY`, `TMDB_API_KEY`), same pattern as `GOOGLE_BOOKS_API_KEY`.
2. Write `scripts/fetchGameCovers.js` and `scripts/fetchTvCovers.js` (or one shared script keyed by category), modeled on `scripts/fetchBookCovers.js`: query per-title, validate images (width ≥ 200px via sharp, same as books), write `.draft.json` + a preview HTML per category.
3. Review the preview HTML, add any wrong/missing covers to override files (`gameCoversOverride.json`, `tvCoversOverride.json`), same override pattern as books.
4. Run finalise scripts → `src/data/gameCovers.json`, `src/data/tvCovers.json` (committed, no runtime API calls — same principle as book covers).
5. **Update `ShelfPage.jsx`**: the non-book card branch currently renders no image at all. It needs an `<img>` block added (same spine/fallback pattern as `BookCard`), reading from the new cover maps by title.
6. **Update Nginx CSP** on the server (`img-src`) to allow the actual image CDN hosts once known (likely `media.rawg.io` and `image.tmdb.org` — confirm exact hosts from real API responses, don't guess).
7. Update README/CLAUDE.md folder structure notes to mention the new data files and scripts.
8. `./deploy.sh "Add cover art for games and TV"`.

---

## Writing Posts

Post frontmatter supports:
- `language`: `"en"` or `"no"` — defaults to `"en"` if absent (backwards compatible with existing posts). Shown as a coloured pill on the list page and in the post header.
- `spotify`: full Spotify playlist/album/track URL (optional). Renders as an embed iframe below the post body with the label "Listening while writing". The embed URL is derived by extracting the ID from the URL (everything after the last `/` and before any `?`).

The `parseFrontmatter.js` parser handles all keys generically — no changes needed when adding new frontmatter fields.

---

## How to Work With Me (Claude Code)

- I understand high-level decisions, not every line of code
- Explain your choices briefly when making architectural decisions
- Ask me before making significant structural changes
- Keep components small and readable
- When I report a bug, describe what you see – don't ask me to read stack traces alone
- Update this CLAUDE.md file if we make decisions that change the project direction

---

## What NOT to Do

- Do not turn this into a CV or resume
- Do not use hardcoded text — everything goes through i18n
- Do not use Create React App — we use Vite
- Do not over-engineer — this is a personal site, keep it simple and clean

---

## Current Status

- [x] Project scaffolded (Vite + React + Tailwind)
- [x] i18n configured (EN + NO)
- [x] Dark/light theme toggle (no flash on load)
- [x] Hero section — name, Pyre badge, intro, donate nudge, section teasers
- [x] Shelf page (`/shelf`) — 59 books with cover art, 50 games, 9 TV entries; tabs + status filters
- [x] Silence page (`/silence`) — noise tool with sleep timer; iOS mute switch compatible
- [x] Writing page (`/writing`) — markdown posts with language pills, footnotes, Spotify embed
- [x] About page (`/about`) — bio, portrait + flower field photo, 6 travel photos in grid; Instagram linked
- [x] Pyre branding — triangle mark in Hero subtitle and Footer, links to pyre.no
- [x] Self-hosted DM Sans fonts — Google Fonts removed; served from `public/fonts/`
- [x] Footnote system — inline hover tooltips (desktop) / bottom-sheet panel (mobile)
- [x] Footer — Pyre logo, GitHub, Instagram, CC license, build date
- [x] Navbar — NM wordmark, two-row mobile layout, pill-style theme/lang toggles; About link added
- [x] SEO meta tags, Open Graph, JSON-LD schema, sitemap (auto-generated)
- [x] WCAG AA accessibility basics (skip link, aria-labels, keyboard navigation)
- [x] Security headers on Nginx (CSP allows Google Books + Open Library)
- [x] Deployed to Hetzner VPS — live at nithun.no
- [x] SSL active (Let's Encrypt)
- [x] Git repository on GitHub
