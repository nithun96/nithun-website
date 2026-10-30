# CLAUDE.md – Nithun Manoharan Personal Website

This file is the memory and rulebook for this project. Read it at the start of every session.

---

## Who I Am

My name is **Nithun Manoharan**. I am a Product Manager specialising in AI and Data Analytics, based in Norway. I am not a professional developer – I know enough HTML/CSS to tweak individual lines, but I rely on you (Claude Code) to write and structure the code. I want to understand what I'm building, but I don't need line-by-line explanations unless I ask.

I have a larger personal mission around climate, nature, and spreading unbiased information. This website is the first step.

---

## Project Goal

Build a **personal website** that:
- Establishes my personal brand online
- Ranks well on Google for the name "Nithun Manoharan" (SEO priority)
- Is **accessible** (WCAG AA compliant)
- Is **creative and bold** in design – not a generic template
- Is a **learning project** for me to understand React and modern frontend development
- Is live at **nithun.no** (original launch target: 06.04.2026)

This is **not** a CV or portfolio. It is a personal brand and identity site.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **React + Vite** | Fast, modern, great learning base |
| Styling | **Tailwind CSS** | Utility-first, widely used, easy to customise |
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
- **Typography:** Serif for headings (Georgia), sans-serif for body (self-hosted DM Sans — see Fonts)
- **Colours:** A neutral dark/light base with 1–2 strong accent colours. Avoid clichéd tech blues. Purple (`--purple`, #A990CF dark / #6B3FA0 light) is Nithun's own colour: wordmark dot, surname, drop cap, text selection. Each section owns one colour (Writing `--dusty`, Silence `--sage`, Shelf `--honey`, About `--stone`) for its number, labels and the fill when a row is hovered (`--*-f`, with `--on` for text on it). Section order and colours live in `src/lib/sections.js`.
- **Layout:** editorial "contents page": the homepage lists the four sections as large numbered rows; every section page has a breadcrumb back to it ("Contents / 02 Silence"). The design system and mockups live in two private claude.ai artifacts (Nithun design system; "Nithun homepage – bolder sample" canvas).
- **Motion and interaction:** modern, interactive and sleek, but always purposeful.
  - Allowed: hover and focus effects, entrance animations (e.g. the name rising in), sections fading in on scroll, and small live previews that actually work (e.g. a Silence play button that plays sound).
  - Not allowed: effects that hide content until they finish, scroll-jacking, parallax, or fake controls that do nothing.
  - Everything must switch off under `prefers-reduced-motion`; content stays fully visible without it.
  - Anything that moves or changes automatically for more than 5 seconds needs a visible pause control (WCAG 2.2.2).
  - Every interaction has a touch and keyboard equivalent; nothing important is hover-only.
  - Every design is checked in dark mode (the default) as well as light.
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
- Books: mix of genres, no need to categorise by field
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

### How SEO works in this codebase
- The site is a single-page app. `index.html` holds the **homepage's** title, description and Open Graph tags, plus the JSON-LD schema, and deliberately **no static canonical tag** (it is also the fallback for unknown URLs).
- **Per-page HTML for link previews:** after `vite build`, `scripts/prerender.js` writes a copy of `index.html` for every page and post with that page's own title, description, canonical URL and Open Graph tags (`dist/about.html`, `dist/writing/<slug>.html`, …). Nginx serves them via `try_files $uri $uri.html =404`, so chat apps and LinkedIn show the right page without running JavaScript. React still renders the body. Any other URL gets `dist/404.html` with a real **404 status** (also written by `prerender.js`), so **a page missing from `PAGES` returns 404**. A trailing slash redirects (`/writing/` → `/writing`), and `/books` → `/shelf`. Posts also get BlogPosting JSON-LD (author, date) in their per-page HTML.
- Each page calls `usePageMeta({ title, description, path })` from `src/lib/usePageMeta.js`, which sets its own title, description, canonical URL and Open Graph tags. Titles/descriptions live under `meta.*` in both translation files; posts use their frontmatter `title` and `summary`.
- **When adding a new page:** (1) call `usePageMeta` in it, (2) add `meta.<page>Title` / `meta.<page>Description` to both translation files, (3) add the URL to `scripts/generate-sitemap.js`, (4) add it to `PAGES` in `scripts/prerender.js`. Posts in `src/writing/` are added to the sitemap, the per-page HTML and the RSS feed automatically.
- Shelf cover and spine art (other people's book art) must stay out of Google Images, where it used to appear in searches for Nithun's name. `/shelf` gets `noimageindex` twice: an `X-Robots-Tag` header from Nginx (a `map` on `$request_uri` in `nginx/nithun-website`) and a robots meta tag added by `ShelfPage.jsx`. Any new page that shows third-party images (e.g. Games/TV covers) needs the same.
- Photos in posts live in `public/images/writing/<slug>/` as webp: a 1000px-wide copy for the page and a full-resolution `-full.webp` for the full-screen view, all metadata stripped (phone photos carry GPS location). Nginx sends `X-Robots-Tag: noindex` for everything under `/images/writing/` (same `map`), so they stay out of Google Images and searches for Nithun's name.
- **Only photos of Nithun himself should appear in image search.** The six travel photos on About (`/images/about/photo-*`), the book spines and Shelf artwork (`/images/shelf/`) and the Silence artwork (`/images/silence/`) get the same `noindex` header. His own photos (portrait, headshot, flower field and their `-sm` copies) stay indexable and are listed as image entries in the sitemap (`IMAGES` in `scripts/generate-sitemap.js`), because the pages are rendered by JavaScript. A new photo of him: add it to `IMAGES`. A new photo that isn't of him: put it under `/images/writing/` or name it `photo-*` in `/images/about/`.
- Unknown URLs get status 404 and React shows `NotFoundPage` (noindex). Don't add `hreflang` tags — language is switched client-side, so there are no separate language URLs.
- Every push to `main` (including a merged PR) deploys automatically via GitHub Actions — see Deployment.

---

## Accessibility Requirements (WCAG AA)

- Colour contrast minimum **4.5:1** for body text, **3:1** for large text
- All interactive elements (including dark/light toggle) keyboard-navigable
- Use `aria-label` on icon-only buttons
- Skip-to-content link at top of page for screen readers
- No content that depends solely on colour to convey meaning

---

## Internationalisation (i18n)

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
├── deploy.sh                       # Deploy: build → scp to server → update Nginx → git commit + push
├── .github/workflows/deploy.yml    # Auto-deploy on every push to main (see Deployment)
├── .github/retired-files.txt       # Files the deploy deletes from the server (uploads never delete)
├── nginx/
│   └── nithun-website              # Nginx site config — copied to the server on every deploy
├── GAME-BRIEF.md                   # Brief for the point-and-click game pilot (see src/game/)
├── design-handoff/                 # Redesign handoff — README.md + nithun.html reference prototype
├── scripts/
│   ├── generate-sitemap.js         # Auto-generates public/sitemap.xml at build time
│   ├── prerender.js                # After vite build: per-page HTML with each page's meta tags + dist/rss.xml (see SEO)
│   ├── fetchBookCovers.js          # `npm run fetch-covers` — see Book Covers
│   ├── finaliseBookCovers.js       # `npm run finalise-covers` — see Book Covers
│   └── makeSilenceSounds.js        # `npm run make-sounds` — renders Silence's sound files (needs ffmpeg)
├── public/
│   ├── favicon.svg                 # Custom NM favicon
│   ├── robots.txt                  # Allows all crawlers, points to the sitemap
│   ├── manifest.webmanifest        # Name, colours and icons for "Add to Home Screen" (served as application/manifest+json)
│   ├── apple-touch-icon.png        # iPhone home-screen icon (180px); icon-192/512 and icon-maskable-512 for Android
│   ├── sitemap.xml                 # Generated at build time — do not edit manually
│   ├── fonts/                      # Self-hosted DM Sans WOFF2 files (see Fonts section)
│   ├── sounds/                     # Silence's sound files — 30-day cache, so a changed file needs a new name
│   └── images/
│       ├── og-nithun.jpg           # Link-preview (Open Graph / Twitter) image
│       ├── nithun.jpeg             # Old link-preview image — no longer referenced
│       ├── writing/                # Photos in posts, one folder per post slug — noindex via Nginx (see SEO)
│       ├── shelf/                  # spines/ — book spines cut from photos of Nithun's shelves; shelf-sm.webp (homepage thumbnail) — noindex
│       ├── silence/                # hills.webp (+ -sm for the homepage) — artwork drawn from brown-noise data — noindex
│       └── about/                  # About page photos — portrait, headshot, flower field, 6 travel shots (webp); smaller copies for srcset: *-sm (324px, also the hero collage), portraits *-600, travel shots *-700
└── src/
    ├── main.jsx                    # Bootstrap — BrowserRouter + i18n init
    ├── App.jsx                     # Root layout — Navbar, Routes, Footer
    ├── i18n.js                     # i18next config — EN/NO, language detection
    ├── styles/
    │   ├── global.css              # Tailwind import, dark mode variant, CSS custom properties
    │   └── shell.js                # Shared page container (SHELL, max 1200px) — keeps top bar, pages and footer aligned
    ├── components/
    │   ├── Navbar.jsx              # Top bar — purple-dot wordmark, "Oslo · Updated <build date>", language + theme pills; breadcrumb on section pages
    │   ├── Footer.jsx              # Footer — LinkedIn, GitHub, Instagram, RSS, CC licence
    │   └── PyreMark.jsx            # Pyre triangle SVG logo — used in Hero subtitle and Footer
    ├── sections/
    │   └── Hero.jsx                # Home page (contents page) — name, standfirst, 4 numbered section rows with thumbnails (Silence's plays brown noise), donate nudge
    ├── pages/
    │   ├── AboutPage.jsx           # /about — bio, portrait, travel photography grid, Instagram link
    │   ├── ShelfPage.jsx           # /shelf — bookcase: a plank per series, real spines where photographed, drawn spines otherwise; tap for details
    │   ├── SilencePage.jsx         # /silence — sound rows, player band (timer, volume), hearing charities
    │   ├── WritingPage.jsx         # /writing — list of markdown posts
    │   ├── WritingPostPage.jsx     # /writing/:slug — individual post renderer
    │   └── NotFoundPage.jsx        # Catch-all for unknown URLs — "page not found", marked noindex
    ├── game/
    │   └── GameLevel1.jsx          # Game pilot (see GAME-BRIEF.md) — not imported or routed yet
    ├── audio/
    │   └── loopPlayer.js           # Silence player — plays public/sounds/ with a 1 s crossfade (see README)
    ├── data/
    │   ├── shelf.json              # Shelf content — 59 books, 50 games, 8 TV entries
    │   ├── bookCovers.json         # Pre-fetched book cover URLs — generated, see Book Covers
    │   ├── bookCoversOverride.json # Manual cover overrides, keyed by exact book title
    │   ├── charities.json          # Charity links shown on Silence page (descriptions translated in silence.charities.*)
    │   └── bookSpines.json         # Title → spine photo in public/images/shelf/spines/ (width at 600px tall, hardcover flag)
    ├── lib/
    │   ├── parseFrontmatter.js     # Parses YAML frontmatter from .md writing files
    │   ├── parseFootnotes.js       # Strips inline footnote syntax from post body, returns {body, footnotes[]}
    │   ├── usePageMeta.js          # Sets per-page title, description, canonical + Open Graph tags (see SEO section)
    │   └── sections.js             # The four sections: order, number, path, colour and fill
    ├── utils/
    │   └── bookCovers.js           # Looks up a book's cover in the pre-fetched bookCovers.json
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

This will build, upload to the server, update the Nginx config, and push to GitHub in one command.

The site is live at **nithun.no** (primary domain). Traffic from www.nithun.no and nithunmanoharan.com redirects to nithun.no.

**Compression and caching** are set in `nginx/nithun-website`: gzip for JS/CSS/JSON/SVG/XML; `/assets/` (hashed build files) cached 1 year, `/fonts/` and `/sounds/` 30 days, `/images/` 7 days; pages always revalidate. Because images and sounds are cached, give a replaced file a new filename rather than overwriting it.

**Removing a file from the site:** the upload only adds and overwrites files, so a file deleted from the repo stays on the server. List it in `.github/retired-files.txt` (path relative to `dist/`) and the next deploy deletes it. Each deploy also logs files on the server that the build doesn't have. Never list `assets/` files: old hashed builds stay so open tabs can still load them.

**Content-Security-Policy:** `script-src` allows the inline theme script in `index.html` by its SHA-256 hash, not `'unsafe-inline'`. Change that script and `npm run build` fails with the new hash to put in `nginx/nithun-website`.

**SSL certificates** are renewed automatically by certbot on the server (nginx authenticator). Every domain on a certificate must have a DNS record, or renewal fails for the whole certificate. That is what let the `.com` certificate expire in July 2026: it covered `www.nithunmanoharan.com`, which has no DNS record. Keep the `.com` redirect inside `location /` (not a server-level `return`) so certbot's temporary challenge location still works.

To check or renew by hand, log in as root with your SSH key (no sudo password needed):
```
ssh root@204.168.209.150
certbot certificates                                       # list certs, domains and expiry dates
certbot renew --dry-run                                    # test renewal of all certs
```

**Automatic deploys:** every push to `main` — including merging a pull request on GitHub, e.g. from a Cowork or cloud session — runs `.github/workflows/deploy.yml`, which builds the site, uploads it and updates Nginx (same steps as `deploy.sh`). Pushes that only change `README.md`, `CLAUDE.md` or `GAME-BRIEF.md` are skipped. Progress and failures show under the repo's **Actions** tab on GitHub, and GitHub emails on failure. A deploy can also be started by hand there ("Run workflow").

It uses a GitHub-only SSH key (secret `DEPLOY_SSH_KEY`, created Oct 2026, comment `github-actions-deploy@nithun-website` in the server's `/home/deploy/.ssh/authorized_keys`) and the server's host keys (secret `DEPLOY_KNOWN_HOSTS`). The `deploy` user can only copy the Nginx config, test it and reload it via sudo. To revoke GitHub's access, delete that key's line from `authorized_keys`.

**Cloud/Cowork sessions:** work on a branch and open a PR. Review the PR (or ask a local session to), then merge it — the site deploys itself. Don't push unreviewed changes straight to `main`.

`./deploy.sh` still works for deploying from this laptop; it deploys directly, and its push to `main` then triggers the workflow, which redeploys the same commit (harmless).

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

## Shelf Spines (photos of Nithun's own books)

The Shelf shows only books Nithun would recommend (`src/data/shelf.json`) — books on his shelves that aren't on that list stay off it on purpose. A book with a spine photo shows it; the rest get a drawn spine, and tapping one shows its front cover from `bookCovers.json` (or the drawn spine if the cover won't load).

- **Files:** `public/images/shelf/spines/<id>.webp`, 600px tall, straightened, cropped to the spine, no metadata. `src/data/bookSpines.json` maps the exact book title to `{ file, w, hardcover }` (`w` = width at 600px tall; hardcovers stand taller).
- **Adding spines:** Nithun sends photos (straight on, one shelf per photo, daylight, no flash). Strip GPS/metadata, cut each spine with a perspective transform (PIL `Image.QUAD`), save as webp at 600px tall, add the entry to `bookSpines.json`. A replaced image needs a new filename (images are cached 7 days).
- **Still to photograph (Oct 2026):** Tolkien (5), A Song of Ice and Fire (5), Night Angel (3), The First Law (3), Kingkiller (2), Malazan (2), The Black Prism, Warbreaker, The Rithmatist, Sofies verden, The Alchemist, A Brief History of Time, Empire in Black and Gold. Wheel of Time 4 is from a distant photo (a close-up would sharpen it).
- **Undecided:** Lord of the Clans, The Last Guardian, Rise of the Horde and Beyond the Dark Portal probably have no spine of their own (they seem to be inside *Warcraft Archive* and *Chronicles of War* — check). Either show the collection's spine for them or keep drawn spines.
- Spine images aren't generally available online (shops show front covers), and cloud sessions can't reach image sites anyway.

---

## Cover Art for Games & TV (planned — do this in VS Code / local Claude Code)

Games and TV/Anime entries have no cover image (unlike Books, which has `bookCovers.json`), so the Shelf page shows books only for now. This can't be built from a cloud session: the API domains below are blocked by that environment's network policy, and no session should have real API keys pasted into chat. Do this locally, where you already have unrestricted network access and can hold the keys yourself.

### Sources
- **Games → RAWG** (api.rawg.io). Free API key, broad coverage including retro/console titles (needed for things like GBA-era Pokémon). Sign up at rawg.io/apidocs.
- **TV/Anime → TMDB** (api.themoviedb.org). Free API key, covers both Western/Korean shows and anime-as-TV-shows under one API — no need for a second source. Sign up at themoviedb.org/settings/api.

Alternatives considered: SteamGridDB (games — nicer curated "grid" art style, but less retro coverage, still needs a key) and AniList (anime only, keyless, but doesn't cover the 4 non-anime TV entries — would still need TMDB alongside it, so no simpler than TMDB alone).

### Plan (mirrors the existing Book Covers workflow above)
1. Get free API keys from RAWG and TMDB; set as env vars locally (`RAWG_API_KEY`, `TMDB_API_KEY`), same pattern as `GOOGLE_BOOKS_API_KEY`.
2. Write `scripts/fetchGameCovers.js` and `scripts/fetchTvCovers.js` (or one shared script keyed by category), modelled on `scripts/fetchBookCovers.js`: query per-title, validate images (width ≥ 200px via sharp, same as books), write `.draft.json` + a preview HTML per category.
3. Review the preview HTML, add any wrong/missing covers to override files (`gameCoversOverride.json`, `tvCoversOverride.json`), same override pattern as books.
4. Run finalise scripts → `src/data/gameCovers.json`, `src/data/tvCovers.json` (committed, no runtime API calls — same principle as book covers).
5. **Update `ShelfPage.jsx`**: it renders books only (a bookcase of spines). Add games and TV as their own sections below the books, reading from the new cover maps by title.
6. **Update Nginx CSP** on the server (`img-src`) to allow the actual image CDN hosts once known (likely `media.rawg.io` and `image.tmdb.org` — confirm exact hosts from real API responses, don't guess).
7. Update README/CLAUDE.md folder structure notes to mention the new data files and scripts.
8. `./deploy.sh "Add cover art for games and TV"`.

---

## Writing Posts

Post frontmatter supports:
- `language`: `"en"` or `"no"` — defaults to `"en"` if absent (backwards compatible with existing posts). Shown as a coloured pill on the list page and in the post header.
- `thumbnail` + `thumbnailAlt` (optional): a small 4:5 image (about 288×360) shown beside the Writing row on the homepage while this is the newest post. Keep it in the post's image folder, e.g. `…/gdansk-neptune-fountain-sm.webp`.
- `spotify`: full Spotify playlist/album/track URL (optional). Renders as an embed iframe below the post body with a translated caption (`writing.spotifyCaption`). The embed URL is derived by extracting the ID from the URL (everything after the last `/` and before any `?`).

The `parseFrontmatter.js` parser handles all keys generically — no changes needed when adding new frontmatter fields.

**RSS:** every post appears in `/rss.xml` (title, link, date, summary), generated at build by `scripts/prerender.js`. The Writing page links to it below the post list (not the footer: browsers show a feed as raw XML, and Chrome drops XSLT feed styling on 17.11.2026), and `index.html` advertises it to feed readers.

**Photos in a post:** raw HTML `<img src="…/name.webp" data-full="…/name-full.webp" alt="…" width height>` inside a `<div style="columns: 2; column-gap: 12px;">` (see `context-window.md`). Every post image becomes a button that opens `ImageLightbox` in `WritingPostPage.jsx`: full screen, click anywhere or Escape to close. No captions; alt text is required. Files and search rules: see SEO.

---

## How to Work With Me (Claude Code)

- I understand high-level decisions, not every line of code
- Explain your choices briefly when making architectural decisions
- Ask me before making significant structural changes
- Keep components small and readable
- When I report a bug, describe what you see – don't ask me to read stack traces alone
- Update this CLAUDE.md file if we make decisions that change the project direction

---

## Licence

- Posts and other content: CC BY-NC 4.0 (stated in the footer). About-page photos: © Nithun Manoharan, excluded.
- Code: all rights reserved — no open-source licence (decided Oct 2026; open it later only if Nithun decides to). Don't add licence headers or a LICENSE file.

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
- [x] Redesign (Oct 2026) — editorial "contents page" homepage, purple identity colour, section colours, motion per Design Principles
- [x] Homepage — name, standfirst, 4 numbered section rows with thumbnails (latest post, a Silence player, Shelf, About), donate nudge
- [x] Shelf page (`/shelf`) — 59 books as a bookcase; 28 real spines photographed from Nithun's shelves, 31 drawn (see Shelf Spines); Games (50) and TV (8) hidden until they have cover art
- [x] Silence page (`/silence`) — sound rows, player band with sleep timer; keeps playing on a locked iPhone and with the mute switch on
- [x] Writing page (`/writing`) — markdown posts with language pills, footnotes, Spotify embed
- [x] About page (`/about`) — bio, portrait + flower field photo, 6 travel photos in grid; Instagram linked
- [x] Pyre branding — triangle mark on the homepage, links to pyre.no
- [x] Self-hosted DM Sans fonts — Google Fonts removed; served from `public/fonts/`
- [x] Footnote system — inline hover tooltips (desktop) / bottom-sheet panel (mobile)
- [x] Footer — LinkedIn, GitHub, Instagram, CC licence
- [x] Top bar — wordmark, build date, theme/lang pills; breadcrumb on section pages
- [x] Per-page HTML for link previews (`scripts/prerender.js`), RSS feed at `/rss.xml`, pages other than Home loaded on demand (`React.lazy` in `App.jsx`)
- [x] SEO — per-page titles/descriptions/canonicals, Open Graph, JSON-LD (incl. Pyre + Instagram), robots.txt, auto-generated sitemap, noindex 404 page
- [x] WCAG AA accessibility basics (skip link, aria-labels, keyboard navigation)
- [x] Security headers on Nginx (CSP with a script hash instead of 'unsafe-inline'; allows Open Library/archive.org images and Spotify embeds only; Permissions-Policy, COOP, HSTS)
- [x] Real 404 status for unknown URLs; home-screen icons and web app manifest
- [x] www.nithun.no, nithunmanoharan.com and www.nithunmanoharan.com all redirect to nithun.no (`.com` DNS is hosted in the Hetzner Console; certificate reissued Oct 2026 with both names)
- [x] Deployed to Hetzner VPS — live at nithun.no
- [x] SSL active (Let's Encrypt)
- [x] Git repository on GitHub
