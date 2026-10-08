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
| Fonts | DM Sans, self-hosted |
| Hosting | Hetzner VPS (Nginx + SSL) |

---

## Project Structure

```
nithun-website/
├── index.html                      # Entry point — homepage meta, Open Graph, JSON-LD schema, dark mode init
├── vite.config.js                  # Vite config — React plugin, Tailwind plugin, build date injection
├── deploy.sh                       # Deploy: build → scp to server → update Nginx → git commit + push
├── nginx/
│   └── nithun-website              # Nginx site config — copied to the server on every deploy
├── scripts/
│   └── generate-sitemap.js         # Auto-generates public/sitemap.xml at build time
├── public/
│   ├── favicon.svg                 # Custom NM favicon
│   ├── robots.txt                  # Allows all crawlers, points to the sitemap
│   ├── sitemap.xml                 # Generated at build time — do not edit manually
│   ├── fonts/                      # Self-hosted DM Sans WOFF2 files
│   └── images/                     # og-nithun.jpg (1200×630 link-preview crop of the archway portrait) + about/ (About page and hero photos)
└── src/
    ├── main.jsx                    # Bootstrap — BrowserRouter + i18n init
    ├── App.jsx                     # Root layout — Navbar, Routes, Footer
    ├── i18n.js                     # i18next config — EN/NO, language detection, keeps <html lang> in sync
    ├── styles/
    │   ├── global.css              # Tailwind import, fonts, design tokens, page-specific CSS
    │   └── shell.js                # Shared page container (SHELL) — aligns Navbar, pages and Footer
    ├── components/
    │   ├── Navbar.jsx              # Sticky nav — NM wordmark, links, language + theme pills
    │   ├── Footer.jsx              # Pyre link, GitHub, licence, build date
    │   └── PyreMark.jsx            # Pyre triangle logo (SVG)
    ├── sections/
    │   └── Hero.jsx                # Home page — name, Pyre badge, intro, photo collage, section teasers
    ├── pages/
    │   ├── AboutPage.jsx           # /about — bio, portraits, travel photos, Instagram link
    │   ├── ShelfPage.jsx           # /shelf — books with cover art (Games/TV hidden for now)
    │   ├── SilencePage.jsx         # /silence — tinnitus noise tool with sleep timer
    │   ├── WritingPage.jsx         # /writing — list of markdown posts
    │   ├── WritingPostPage.jsx     # /writing/:slug — individual post renderer
    │   └── NotFoundPage.jsx        # Any unknown URL — "page not found", marked noindex
    ├── audio/
    │   └── noiseEngine.js          # Web Audio API noise engine (brown, pink, rain, ocean)
    ├── data/
    │   ├── shelf.json              # Shelf content — 59 books, 50 games, 9 TV entries
    │   ├── bookCovers.json         # Pre-fetched cover URLs (generated — see CLAUDE.md)
    │   ├── bookCoversOverride.json # Manual cover fixes
    │   └── charities.json          # Charity links shown on Silence page
    ├── lib/
    │   ├── parseFrontmatter.js     # Parses YAML frontmatter from .md writing files
    │   ├── parseFootnotes.js       # Parses [^N: type: text] footnote syntax from post body
    │   └── usePageMeta.js          # Sets title, description, canonical and Open Graph tags per page
    ├── utils/
    │   └── bookCovers.js           # Looks up a book's cover in bookCovers.json
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
| `/` | `Hero` | Home — name, intro, photo collage, section teasers |
| `/writing` | `WritingPage` | List of writing posts |
| `/writing/:slug` | `WritingPostPage` | Individual writing post |
| `/silence` | `SilencePage` | Tinnitus noise tool |
| `/shelf` | `ShelfPage` | Books shelf |
| `/about` | `AboutPage` | Bio and photography |
| `/books` | → `/shelf` | Redirect |
| anything else | `NotFoundPage` | Page not found (noindex) |

---

## How It Fits Together

### Startup (`main.jsx`)
React mounts into `<div id="root">` in `index.html`. `i18n.js` is imported first to initialise language detection. The app is wrapped in `BrowserRouter` for client-side navigation.

### Layout (`App.jsx`)
Every page shares: `Navbar`, `<main>` with `<Routes>`, and `Footer`. A translated skip-to-content link is the first element in the page (visible on keyboard focus), and `<main>` can take focus so the skip lands correctly. All three use the `SHELL` container from `styles/shell.js` so their edges line up.

### Theme and language (`Navbar.jsx`)
The theme pill toggles a `.dark` class on `<html>`; the preference is saved in `localStorage` and restored before React boots via an inline script in `index.html` (prevents a flash of the wrong theme). The language pill calls `i18n.changeLanguage()`. `i18n.js` keeps `<html lang>` in sync with the active language, both on first load and whenever it changes.

### Home page (`Hero.jsx`)
Name as `<h1>`, a "Building Pyre · Oslo" line linking to pyre.no, a short intro, and a three-photo collage. Below: four teaser cards linking to Writing, Silence, Shelf and About, then a donation nudge.

### Shelf (`ShelfPage.jsx`)
Books only for now — Games and TV are hidden until they have cover art (re-enable by adding `'games', 'tv'` back to `CATEGORIES`). Covers come from `bookCovers.json`, pre-fetched at dev time, so there are no API calls at runtime. Cover art is kept out of Google Images with a `noimageindex` robots tag.

### About (`AboutPage.jsx`)
Bio, two portraits, six travel photos with locations, and an Instagram link. Photos are © Nithun Manoharan and excluded from the site's CC BY-NC licence.

### Silence (`SilencePage.jsx`)
Noise tool for tinnitus and sleep. Uses `noiseEngine.js` (Web Audio API) to synthesise brown, pink, rain, and ocean sounds. Features: per-sound volume, sleep timer with fade-out, charity donation links. On iOS, a near-silent `<audio>` element is started inside the play gesture to force the "playback" audio session category — this keeps audio playing when the hardware mute switch is on.

### Noise engine (`audio/noiseEngine.js`)
Framework-agnostic Web Audio module, designed to be extractable into a standalone Capacitor mobile app. Synthesises: brown noise (leaky integrator random walk), pink noise (Paul Kellet IIR 1/f approximation), rain (three blended layers — bandpass white noise body, low rumble, LFO-modulated high-frequency drops), and ocean (amplitude-modulated white noise with slow sine envelope).

### Writing (`WritingPage.jsx` + `WritingPostPage.jsx`)
Posts are `.md` files in `src/writing/` with YAML frontmatter (title, date, summary, tags, readTime, language, spotify). `parseFrontmatter.js` strips and parses frontmatter; `parseFootnotes.js` processes inline footnote syntax `[^N: type: text]` before markdown rendering. Posts are sorted by date, rendered with `react-markdown` + `rehype-raw`.

Footnote system: two types — `clarification` (quiet aside) and `wry` (warm left border). Desktop: hover or keyboard focus shows the tooltip, click or Enter/Space pins it, Escape closes it. Mobile: tap opens a bottom sheet portal rendered directly on `document.body`; it is a dialog that takes focus when opened, closes on Escape, returns focus to the marker, and is hidden from the tab order when closed.

Language pill: each post carries a `language` field (`"en"` or `"no"`, defaults to `"en"`). Shown as a coloured pill on the list page and in the post header. The post's title and body are also marked with that `lang` attribute.

Spotify embed: if a post has a `spotify` URL in its frontmatter, an embedded Spotify player is rendered below the post body with a translated caption (`writing.spotifyCaption`).

### Translations (`locales/`)
All user-facing text lives in `en/translation.json` and `no/translation.json`. Nothing is hardcoded in JSX.

To add or edit a string:
1. Add the same key to both locale files
2. Use it in JSX: `const { t } = useTranslation()` → `{t('your.key')}`

### SEO
- `index.html` holds the homepage's title, description, Open Graph tags and the JSON-LD `Person` schema (with Pyre affiliation and LinkedIn, GitHub and Instagram profiles).
- `lib/usePageMeta.js` sets each page's own title, description, canonical URL and Open Graph tags when it loads. Page titles and descriptions live under `meta` in the translation files; posts use their frontmatter title and summary.
- `public/robots.txt` points crawlers to the sitemap. `scripts/generate-sitemap.js` lists every page and post, and runs on every build. **When adding a new page, add it to the sitemap script too.**
- Unknown URLs show `NotFoundPage`, marked `noindex`.

---

## Accessibility

- **Contrast:** the accent colours (`--sage`, `--dusty`, `--stone`, `--honey`, `--wheat`) and the muted text colour (`--fgm`) are darker in light mode so text in them reaches 4.5:1 on both page backgrounds; dark mode uses the original lighter values. Check contrast when adding a new colour token.
- **Focus:** a global `:focus-visible` outline in `global.css`. Don't add `outline: none` without a replacement.
- **Motion:** `prefers-reduced-motion` switches off animations, transitions and smooth scrolling.
- **Known gaps:** Silence controls don't announce play/stop to screen readers, Shelf tabs aren't marked up as tabs, the theme/language pills are smaller than 24px, and the game prototype is English-only.

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
3. Copies `nginx/nithun-website` to the server, tests it and reloads Nginx
4. Commits and pushes all changes to GitHub

**Automatic deploys:** every push to `main`, including merging a pull request on GitHub, runs `.github/workflows/deploy.yml` (same build, upload and Nginx steps). Docs-only pushes (`README.md`, `CLAUDE.md`) are skipped. Watch runs under the repo's **Actions** tab.

Nginx serves `dist/` with `try_files` so React Router's client-side routes work on direct URL access. www.nithun.no and nithunmanoharan.com both redirect to nithun.no. Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are configured in Nginx.

**CSP note:** the `Content-Security-Policy` must explicitly allow external domains. Currently permitted: `covers.openlibrary.org`, `archive.org` and `*.archive.org` (img-src, for book covers) and `open.spotify.com` (frame-src, for Spotify embeds). Fonts, scripts and data requests are same-origin only.

---

## What's Live

- [x] Project scaffolded (Vite + React + Tailwind)
- [x] i18n configured (EN + NO)
- [x] Dark/light theme toggle (no flash on load)
- [x] Home page — name, Pyre badge, intro, photo collage, four section teasers, donation nudge
- [x] Shelf page (`/shelf`) — 59 books with cover art; Games and TV hidden until they have covers
- [x] Silence page (`/silence`) — noise tool with sleep timer; iOS mute switch compatible
- [x] Writing page (`/writing`) — markdown posts with language pills, footnotes, Spotify embeds
- [x] About page (`/about`) — bio, portraits, travel photos, Instagram link
- [x] Footer — Pyre link, GitHub, licence, build date
- [x] SEO — per-page titles, descriptions and canonicals; Open Graph; JSON-LD; robots.txt; auto-generated sitemap; noindex not-found page
- [x] WCAG AA accessibility — translated skip link, aria-labels, keyboard-accessible footnotes, visible focus, AA contrast in both themes, reduced-motion support, `<html lang>` follows the language (known gaps listed under Accessibility)
- [x] Security headers on Nginx
- [x] Deployed to Hetzner VPS — live at nithun.no
- [x] SSL active (Let's Encrypt)
- [x] Git repository on GitHub
