# nithun.no — Personal Website

Personal website for Nithun Manoharan. Built as a hobby project to learn modern frontend development and establish a personal presence online. Live at [nithun.no](https://nithun.no).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Internationalisation | react-i18next |
| Hosting | Hetzner VPS (Nginx + SSL) |

---

## Project Structure

```
nithun-website/
├── index.html                      # Entry point — SEO meta, Open Graph, JSON-LD schema, dark mode init
├── vite.config.js                  # Vite config — React plugin, Tailwind plugin, build date injection
├── deploy.sh                       # Deploy: build → scp to server → git commit + push
├── scripts/
│   └── generate-sitemap.js         # Auto-generates public/sitemap.xml at build time
├── public/
│   ├── favicon.svg                 # Custom NM favicon
│   └── sitemap.xml                 # Generated at build time — do not edit manually
└── src/
    ├── main.jsx                    # Bootstrap — BrowserRouter + i18n init
    ├── App.jsx                     # Root layout — Navbar, Routes, Footer
    ├── i18n.js                     # i18next config — EN/NO, language detection
    ├── styles/
    │   └── global.css              # Tailwind import, dark mode variant, CSS custom properties
    ├── components/
    │   ├── Navbar.jsx              # Navigation bar (sticky, frosted glass)
    │   ├── Footer.jsx              # Footer with social links and build date
    │   ├── ThemeToggle.jsx         # Dark/light toggle with SVG icons
    │   └── LangToggle.jsx          # EN/NO language toggle
    ├── sections/
    │   └── Hero.jsx                # Home page — name, location, intro, teaser, section teasers
    ├── pages/
    │   ├── ShelfPage.jsx           # /shelf — books/games/TV with cover art and status filters
    │   ├── SilencePage.jsx         # /silence — tinnitus noise tool with sleep timer
    │   ├── WritingPage.jsx         # /writing — list of markdown posts
    │   └── WritingPostPage.jsx     # /writing/:slug — individual post renderer
    ├── audio/
    │   └── noiseEngine.js          # Web Audio API noise engine (brown, pink, rain, ocean)
    ├── data/
    │   ├── shelf.json              # Shelf content — 94 books, 49 games, 2 TV entries
    │   └── charities.json          # Charity links shown on Silence page
    ├── lib/
    │   └── parseFrontmatter.js     # Parses YAML frontmatter from .md writing files
    ├── utils/
    │   └── bookCovers.js           # Cover art — Google Books (primary), Open Library (fallback)
    ├── writing/
    │   └── *.md                    # Writing posts — YAML frontmatter + markdown body
    └── locales/
        ├── en/translation.json     # English strings
        └── no/translation.json     # Norwegian strings
```

---

## Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `Hero` | Home — name, intro, section teasers |
| `/writing` | `WritingPage` | List of writing posts |
| `/writing/:slug` | `WritingPostPage` | Individual writing post |
| `/silence` | `SilencePage` | Tinnitus noise tool |
| `/shelf` | `ShelfPage` | Books, games, TV shelf |
| `/books` | → `/shelf` | Permanent redirect |

---

## How It Fits Together

### Startup (`main.jsx`)
React mounts into `<div id="root">` in `index.html`. `i18n.js` is imported first to initialise language detection. The app is wrapped in `BrowserRouter` for client-side navigation.

### Layout (`App.jsx`)
Every page shares: `Navbar`, `<main>` with `<Routes>`, and `Footer`. A hidden skip-to-content link sits at the top for keyboard/screen reader accessibility.

### Theme (`ThemeToggle.jsx`)
Toggles a `.dark` class on `<html>`. Preference is persisted in `localStorage` and restored before React boots via an inline script in `index.html` (prevents flash of wrong theme). Tailwind's dark mode responds to this class via a custom `@custom-variant` in `global.css`.

### Language (`LangToggle.jsx`)
Calls `i18n.changeLanguage()` to switch between `en` and `no`. Updates `document.documentElement.lang` in sync for screen readers and SEO.

### Home page (`Hero.jsx`)
Renders name as `<h1>`, location line, intro paragraph, and a teaser quote. Below: three section-teaser cards linking to Writing, Silence, and Shelf.

### Shelf (`ShelfPage.jsx`)
Three tabs — Books, Games, TV — each filtered by status (All / Currently / Finished / Want to). Book cards fetch cover art asynchronously via `bookCovers.js`. Games and TV cards show a spine/title placeholder. Data comes from `src/data/shelf.json`.

### Cover art (`utils/bookCovers.js`)
Tries Google Books API first (no key needed); upscales thumbnail from `zoom=1` to `zoom=3`. Falls back to Open Library search (cover_i ID or ISBN). Results are cached in a `Map` for the session. Never throws; returns `null` on failure.

### Silence (`SilencePage.jsx`)
Noise tool for tinnitus and sleep. Uses `noiseEngine.js` (Web Audio API) to synthesise brown, pink, rain, and ocean sounds. Features: per-sound volume, sleep timer with fade-out, charity donation links. On iOS, a near-silent `<audio>` element is started inside the play gesture to force the "playback" audio session category — this keeps audio playing when the hardware mute switch is on.

### Noise engine (`audio/noiseEngine.js`)
Framework-agnostic Web Audio module, designed to be extractable into a standalone Capacitor mobile app. Synthesises: brown noise (lowpass-filtered white noise), pink noise (1/f approximation), rain (three blended layers with LFO modulation), and ocean (amplitude-modulated brown noise).

### Writing (`WritingPage.jsx` + `WritingPostPage.jsx`)
Posts are `.md` files in `src/writing/` with YAML frontmatter (title, date, description, language). `parseFrontmatter.js` strips and parses frontmatter at build time via `import.meta.glob`. Posts are sorted by date, rendered with `react-markdown`.

### Translations (`locales/`)
All user-facing text lives in `en/translation.json` and `no/translation.json`. Nothing is hardcoded in JSX.

To add or edit a string:
1. Add the same key to both locale files
2. Use it in JSX: `const { t } = useTranslation()` → `{t('your.key')}`

### SEO (`index.html`)
- `<title>` and `<meta name="description">` for Google
- `<link rel="canonical">` and `<link rel="sitemap">`
- `hreflang` tags for EN, NO, and `x-default`
- Open Graph tags for rich link previews
- JSON-LD `Person` schema for Google Knowledge Panel eligibility

---

## Dark Mode

Default is dark. Tailwind's dark mode uses the `.dark` class on `<html>`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

The html background colour is also set in plain CSS (not just Tailwind) to prevent a white flash on mobile overscroll.

---

## Deploy

```bash
./deploy.sh "Your commit message"
```

In order:
1. Builds the project (`npm run build` + sitemap generation)
2. Uploads `dist/` to the Hetzner VPS via `scp`
3. Commits and pushes all changes to GitHub

Nginx serves `dist/` with `try_files` so React Router's client-side routes work on direct URL access. Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are configured in Nginx. Traffic from nithunmanoharan.com redirects to nithun.no.

**CSP note:** The Nginx `Content-Security-Policy` must explicitly allow external domains. Currently permitted: `https://books.google.com`, `https://covers.openlibrary.org` (img-src) and `https://www.googleapis.com`, `https://openlibrary.org` (connect-src).

---

## What's Live

- [x] Project scaffolded (Vite + React + Tailwind)
- [x] i18n configured (EN + NO)
- [x] Dark/light theme toggle (no flash on load)
- [x] Hero section — name, intro, section teasers
- [x] Shelf page (`/shelf`) — 94 books with cover art, 49 games, TV entries; tabs + status filters
- [x] Silence page (`/silence`) — noise tool with sleep timer; iOS mute switch compatible
- [x] Writing page (`/writing`) — markdown posts with frontmatter, rendered with react-markdown
- [x] Footer with social icon links and build date
- [x] SEO meta tags, Open Graph, JSON-LD schema, sitemap (auto-generated)
- [x] WCAG AA accessibility basics (skip link, aria-labels, keyboard navigation)
- [x] Security headers on Nginx
- [x] Deployed to Hetzner VPS — live at nithun.no
- [x] SSL active (Let's Encrypt)
- [x] Git repository on GitHub
