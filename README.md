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
│   ├── generate-sitemap.js         # Auto-generates public/sitemap.xml at build time
│   └── makeSilenceSounds.js        # `npm run make-sounds` — renders Silence's sound files (needs ffmpeg)
├── public/
│   ├── favicon.svg                 # Custom NM favicon
│   ├── robots.txt                  # Allows all crawlers, points to the sitemap
│   ├── sitemap.xml                 # Generated at build time — do not edit manually
│   ├── fonts/                      # Self-hosted DM Sans WOFF2 files
│   ├── sounds/                     # Silence's sound files — a 5-minute loop and a fade-out version per sound
│   └── images/                     # og-nithun.jpg (1200×630 link-preview crop of the archway portrait) + about/ (About page and hero photos) + writing/ (photos in posts, one folder per slug, noindex)
└── src/
    ├── main.jsx                    # Bootstrap — i18n init + the routes (data router, lazy pages)
    ├── App.jsx                     # Root layout — Navbar, page outlet, Footer, scroll restoration
    ├── i18n.js                     # i18next config — EN/NO, language detection, keeps <html lang> in sync
    ├── styles/
    │   ├── global.css              # Tailwind import, fonts, design tokens, page-specific CSS
    │   └── shell.js                # Shared page container (SHELL) — aligns Navbar, pages and Footer
    ├── components/
    │   ├── Navbar.jsx              # Top bar — wordmark, section links, language + theme pills
    │   ├── Footer.jsx              # LinkedIn, GitHub, Instagram, build date, licence
    │   └── PyreMark.jsx            # Pyre triangle logo (SVG)
    ├── sections/
    │   └── Hero.jsx                # Home page — contents page: name, standfirst, 4 numbered section rows
    ├── pages/
    │   ├── AboutPage.jsx           # /about — heading, bio beside portraits, travel photos, Instagram link
    │   ├── ShelfPage.jsx           # /shelf — bookcase of real and drawn spines (Games/TV hidden for now)
    │   ├── SilencePage.jsx         # /silence — sound rows, player band, hearing charities
    │   ├── WritingPage.jsx         # /writing — heading, posts as rows, RSS line
    │   ├── WritingPostPage.jsx     # /writing/:slug — individual post renderer
    │   └── NotFoundPage.jsx        # Any unknown URL — "page not found", marked noindex
    ├── audio/
    │   └── loopPlayer.js           # Silence player — plays the sound files in public/sounds/
    ├── data/
    │   ├── shelf.json              # Shelf content — 58 books, 50 games, 8 TV entries
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
| `/` | `Hero` | Home — contents page: name, standfirst, numbered section rows |
| `/writing` | `WritingPage` | List of writing posts |
| `/writing/:slug` | `WritingPostPage` | Individual writing post |
| `/silence` | `SilencePage` | Tinnitus noise tool |
| `/shelf` | `ShelfPage` | Bookcase of recommended books |
| `/about` | `AboutPage` | Bio and photography |
| `/books` | → `/shelf` | Redirect |
| anything else | `NotFoundPage` | Page not found (noindex) |

---

## How It Fits Together

### Startup (`main.jsx`)
React mounts into `<div id="root">` in `index.html`. `i18n.js` is imported first to initialise language detection. The routes are defined here with `createBrowserRouter` (a React Router "data router"): every page except Home is a `lazy` route, loaded before the switch, so links with `viewTransition` can cross-fade between pages without flashing an empty page.

### Layout (`App.jsx`)
Every page shares: `Navbar` (top bar with links to the four sections), `<main>` with the page (`<Outlet />`), and `Footer`. `<ScrollRestoration />` starts each new page at the top and returns you to your place on Back. A translated skip-to-content link is the first element in the page (visible on keyboard focus), and `<main>` can take focus so the skip lands correctly. All three use the `SHELL` container from `styles/shell.js` so their edges line up.

### Theme and language (`Navbar.jsx`)
The theme pill toggles a `.dark` class on `<html>`; the preference is saved in `localStorage` and restored before React boots via an inline script in `index.html` (prevents a flash of the wrong theme). The language pill calls `i18n.changeLanguage()`. `i18n.js` keeps `<html lang>` in sync with the active language, both on first load and whenever it changes.

### Home page (`Hero.jsx`)
A "contents page": the name as a large two-line `<h1>` (surname in purple), a standfirst (Pyre link, role, location, intro with a purple drop cap, headshot), then four numbered rows for Writing, Silence, Shelf and About (order and colours in `lib/sections.js`). Hovering or focusing a row fills it with the section's colour. Each row has a thumbnail that is always visible: the newest post's `thumbnail`, a real brown-noise player for Silence, the Shelf artwork, and the flower-field photo. A donation nudge closes the page.

### Shelf (`ShelfPage.jsx`)
A bookcase of the books Nithun recommends: one plank per series, labelled underneath. Books photographed on his own shelves show their real spine (`data/bookSpines.json`, images in `public/images/shelf/spines/`); the rest get a drawn spine. Tapping a spine lifts it and opens a panel with its title, author and series position; for drawn spines the panel shows the front cover from `bookCovers.json` (loaded from Open Library). Escape or "Put it back" closes it. Games and TV are hidden until they have cover art. Spine and cover art is kept out of Google Images (`noimageindex` tag, and `noindex` on the image files).

### About (`AboutPage.jsx`)
A large "About / Nithun Manoharan" heading, then the bio (linking Pyre, Writing, Silence and Shelf; first paragraph as a serif lead) beside two photos of Nithun with a caption, six travel photos with translated locations, and an Instagram link. Every photo has smaller copies (`-sm`, `-600`, `-700`) and `srcset`, so phones and laptops download only the size they need. Photos are © Nithun Manoharan and excluded from the site's CC BY-NC licence.

### Silence (`SilencePage.jsx`)
Sound tool for tinnitus and sleep: four large sound rows (brown noise, pink noise, rain, ocean) that fill green while playing, a player band with a play/pause button, sleep timer countdown (30/60/90 min, 60-second fade-out) and volume, and hearing charity rows. The volume slider shows only where the browser can change volume (not on iPhone or iPad, which use their volume buttons).

### Player (`audio/loopPlayer.js`) and sounds (`public/sounds/`)
Plays audio files with `<audio>` elements, which keep playing on a locked iPhone and ignore the mute switch (the Web Audio API it used before stops when the phone locks). Each sound is a 5-minute loop file with 1 s fades at both ends; a second copy starts 1 s before the first ends, so they crossfade with no gap. For the sleep timer the last copy is a version that fades out over 60 s. A tap shows the sound as playing at once, before the file has loaded; if another app takes over the sound (a video, a call), Silence counts that as stopped. `npm run make-sounds` (needs ffmpeg) renders the files with `scripts/makeSilenceSounds.js`: brown noise (leaky integrator), pink noise (Paul Kellet filter), rain (three filtered layers with swell, patter and random drops) and ocean (white noise under a slow wave swell), all at the same loudness. A changed file needs a new name, because Nginx lets browsers cache `/sounds/` for 30 days.

### Writing (`WritingPage.jsx` + `WritingPostPage.jsx`)
Posts are `.md` files in `src/writing/` with YAML frontmatter (title, date, summary, tags, readTime, language, spotify). `parseFrontmatter.js` strips and parses frontmatter; `parseFootnotes.js` processes inline footnote syntax `[^N: type: text]` before markdown rendering. Posts are sorted by date, rendered with `react-markdown` + `rehype-raw`.

Footnote system: two types — `clarification` (quiet aside) and `wry` (warm left border). Desktop: hover or keyboard focus shows the tooltip, click or Enter/Space pins it, Escape closes it. Mobile: tap opens a bottom sheet portal rendered directly on `document.body`; it is a dialog that takes focus when opened, closes on Escape, returns focus to the marker, and is hidden from the tab order when closed.

Language pill: each post carries a `language` field (`"en"` or `"no"`, defaults to `"en"`). Shown as a coloured pill on the list page and in the post header. The post's title and body are also marked with that `lang` attribute.

Photos: post images (raw HTML `<img>` with a `data-full` full-resolution file) open full screen on click via `ImageLightbox`; files live in `public/images/writing/<slug>/` and are kept out of image search by an Nginx `X-Robots-Tag: noindex`.

Spotify embed: if a post has a `spotify` URL in its frontmatter, an embedded Spotify player is rendered below the post body with a translated caption (`writing.spotifyCaption`) and a translated title for screen readers (`writing.spotifyTitle`).

### Translations (`locales/`)
All user-facing text lives in `en/translation.json` and `no/translation.json`. Nothing is hardcoded in JSX.

To add or edit a string:
1. Add the same key to both locale files
2. Use it in JSX: `const { t } = useTranslation()` → `{t('your.key')}`

### SEO
- `index.html` holds the homepage's title, description, Open Graph tags and the JSON-LD `Person` schema (with Pyre affiliation and LinkedIn, GitHub and Instagram profiles).
- `lib/usePageMeta.js` sets each page's own title, description, canonical URL and Open Graph tags when it loads. Page titles and descriptions live under `meta` in the translation files; posts use their frontmatter title and summary.
- `public/robots.txt` points crawlers to the sitemap. `scripts/generate-sitemap.js` lists every page and post, plus image entries for the photos of Nithun, and runs on every build. Other images (Shelf covers, post photos, About travel photos) are kept out of image search by Nginx. **When adding a new page, add it to the sitemap script too.**
- Unknown URLs show `NotFoundPage`, marked `noindex`.

---

## Accessibility

- **Contrast:** the accent colours (`--sage`, `--dusty`, `--stone`, `--honey`, `--wheat`) and the muted text colour (`--fgm`) are darker in light mode so text in them reaches 4.5:1 on both page backgrounds; dark mode uses the original lighter values. Check contrast when adding a new colour token.
- **Focus:** a global `:focus-visible` outline in `global.css`. Don't add `outline: none` without a replacement.
- **Motion:** `prefers-reduced-motion` switches off animations, transitions, page transitions and smooth scrolling, including their delays, so staggered entrances (homepage rows, Silence rows, Shelf spines) show at once instead of popping in.
- **Known gaps:** The game prototype is English-only. Speed: a post page is the slowest (the Markdown renderer runs in the browser); the next step there would be turning posts into HTML at build time.

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

Nginx serves `dist/` with `try_files $uri $uri.html =404`: the `.html` step picks up the per-page copies `scripts/prerender.js` writes after the build (each with its own title, description, canonical and Open Graph tags, for link previews; posts also get BlogPosting JSON-LD). Anything else gets `dist/404.html` with status 404, so every page needs an entry in `PAGES` in `prerender.js`. Trailing slashes redirect (`/writing/` → `/writing`) and `/books` → `/shelf`. www.nithun.no and nithunmanoharan.com both redirect to nithun.no. Security headers (CSP with a hash for the inline theme script, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy) are configured in Nginx. Files removed from the site are deleted from the server via `.github/retired-files.txt`. `manifest.webmanifest` and the PNG icons give the site a proper icon and name when added to a home screen.

**CSP note:** the `Content-Security-Policy` must explicitly allow external domains. Currently permitted: `covers.openlibrary.org`, `archive.org` and `*.archive.org` (img-src, for book covers) and `open.spotify.com` (frame-src, for Spotify embeds). Fonts, scripts and data requests are same-origin only.

---

## What's Live

- [x] Project scaffolded (Vite + React + Tailwind)
- [x] i18n configured (EN + NO)
- [x] Dark/light theme toggle (no flash on load)
- [x] Home page — name, standfirst, four numbered section rows with thumbnails (incl. a working brown-noise player), donation nudge
- [x] Redesign (Oct 2026) — contents-page homepage, purple identity colour, section colours, motion that switches off with reduced motion
- [x] Shelf page (`/shelf`) — bookcase of 58 books, 30 with real spines from Nithun's shelves; Games and TV hidden until they have covers
- [x] Silence page (`/silence`) — sound rows and player band with sleep timer; keeps playing on a locked iPhone and with the mute switch on
- [x] Writing page (`/writing`) — markdown posts with language pills, footnotes, Spotify embeds
- [x] About page (`/about`) — bio, portraits, travel photos, Instagram link
- [x] Top bar with section links; page transitions; footer with LinkedIn, GitHub, Instagram, build date, licence
- [x] SEO — per-page titles, descriptions and canonicals (also in prerendered per-page HTML, so link previews work); Open Graph; JSON-LD; robots.txt; auto-generated sitemap; noindex not-found page
- [x] RSS feed at `/rss.xml`, linked at the bottom of `/writing` (moved from the footer, Oct 2026)
- [x] Pages other than Home load on demand, so the first visit downloads about half as much script
- [x] WCAG AA accessibility — translated skip link, aria-labels, keyboard-accessible footnotes, visible focus, AA contrast in both themes, reduced-motion support, `<html lang>` follows the language (known gaps listed under Accessibility)
- [x] Security headers on Nginx
- [x] Deployed to Hetzner VPS — live at nithun.no
- [x] SSL active (Let's Encrypt)
- [x] Git repository on GitHub
