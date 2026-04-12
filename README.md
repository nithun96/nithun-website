# nithunmanoharan.com — Personal Website (v1)

Personal website for Nithun Manoharan. Built as a hobby project to learn modern frontend development, and to establish a personal presence online. Live at [nithun.no](https://nithun.no).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Internationalisation | react-i18next |
| Hosting | Hetzner VPS (Nginx + SSL) |

---

## Project Structure

```
Website Project/
├── index.html                  # Entry point — SEO meta tags, Open Graph, JSON-LD schema, Google Fonts, dark mode init script
├── vite.config.js              # Vite config — React plugin, Tailwind plugin, build date injection
├── deploy.sh                   # Deploy script — build, upload to server, commit and push to GitHub
├── public/
│   ├── favicon.svg             # Custom NM favicon
│   ├── sitemap.xml             # Sitemap for Google (home + /books, with hreflang)
│   └── images/
│       └── nithun.jpeg         # Profile photo (optimised, ~65KB)
└── src/
    ├── main.jsx                # App bootstrap — wraps App in BrowserRouter + StrictMode
    ├── App.jsx                 # Root layout — Navbar, main content (routes), Footer
    ├── i18n.js                 # i18next config — language detection, EN/NO resources
    ├── styles/
    │   └── global.css          # Tailwind import, dark mode variant, font variables, html background
    ├── components/             # Reusable UI pieces used across pages
    │   ├── Navbar.jsx          # Top navigation bar
    │   ├── Footer.jsx          # Bottom footer with social links and build date
    │   ├── ThemeToggle.jsx     # Dark/light mode toggle
    │   └── LangToggle.jsx      # EN/NO language toggle
    ├── sections/               # Fragments that make up the home page
    │   └── Hero.jsx            # Main home section — photo, name, tagline, intro text
    ├── pages/                  # Full route-level page components
    │   └── BooksPage.jsx       # /books — full books list with structured per-author entries
    └── locales/
        ├── en/
        │   └── translation.json    # English strings
        └── no/
            └── translation.json    # Norwegian strings
```

---

## How It Fits Together

### Startup (`main.jsx`)
React mounts into `<div id="root">` in `index.html`. Before rendering, `i18n.js` is imported to initialise language detection. The whole app is wrapped in `BrowserRouter` so React Router can handle client-side navigation.

### Layout (`App.jsx`)
Every page shares the same shell: `Navbar` at the top, a `<main>` block in the middle, and `Footer` at the bottom. The `<Routes>` inside `<main>` decides which page component to render:
- `/` → `Hero` (home page)
- `/books` → `BooksPage`

A hidden skip-to-content link sits at the very top for keyboard/screen reader accessibility.

### Navigation (`Navbar.jsx`)
- **NM logo** — links back to `/`
- **Books** — React Router `<Link>` to `/books` (client-side navigation, no page reload)
- **Contact** — plain `href="#footer"` that scrolls to the footer anchor
- **LangToggle** and **ThemeToggle** on the right

### Theme (`ThemeToggle.jsx`)
Toggles a `.dark` class on the `<html>` element. The preference is saved to `localStorage` and restored on page load. Tailwind's dark mode is configured to respond to this class (not the system `prefers-color-scheme` media query) via a custom variant in `global.css`.

To prevent a flash of light mode on load, `index.html` contains an inline script that runs before React boots and applies `.dark` immediately if needed.

### Language (`LangToggle.jsx`)
Calls `i18n.changeLanguage()` to switch between `en` and `no`. Also updates `document.documentElement.lang` so the HTML `lang` attribute stays correct for screen readers and SEO. Language detection on first visit reads from `localStorage`, then browser settings.

### Home page (`Hero.jsx`)
Reads all text from the translation file. The intro is an array of strings, each rendered as its own paragraph. The "Short Ramble" / "Litt Rabling" heading sits above the intro block.

### Books page (`BooksPage.jsx`)
Reads the `books.items` array from the translation file. Each item can have one of three shapes, which the component handles:
- `text` — a single paragraph (Robert Jordan)
- `paragraphs` — an array of paragraphs separated by a thin `<hr>` line (Tolkien, one paragraph per book)
- `textBefore` + `series` + `textAfter` — intro text, a bullet list of series titles, then closing text (Brandon Sanderson)

Author names are rendered as `<h2>` headings using the serif font.

### Footer (`Footer.jsx`)
Contains LinkedIn and GitHub SVG icon links (with `aria-label` for accessibility) and a "Last updated" line. The date is baked in at build time via `__BUILD_DATE__` (injected by Vite's `define` in `vite.config.js`), so it always reflects when `npm run build` was last run. The "Last updated:" / "Sist oppdatert:" label is translated via i18n.

### Translations (`locales/`)
All user-facing text lives in `en/translation.json` and `no/translation.json`. Nothing is hardcoded in JSX. The structure mirrors the component hierarchy: `nav.*`, `hero.*`, `books.*`, `footer.*`.

#### Adding or editing a string

1. Open both `src/locales/en/translation.json` and `src/locales/no/translation.json`
2. Add the same key in both files with the appropriate translation
3. Use the key in JSX with `const { t } = useTranslation()` and `{t('your.key')}`

#### Adding a new language

1. Create `src/locales/de/translation.json` (or whichever language code)
2. Copy the structure from `en/translation.json` and translate all values
3. In `src/i18n.js`, import the file and add it to the `resources` object
4. Update `LangToggle.jsx` to cycle through the new language
5. Add a `hreflang` tag for the new language in `index.html`

#### Translation file structure

Values can be one of three types depending on what the component needs:

| Type | When to use | Example key |
|---|---|---|
| `string` | Single line of text | `nav.books`, `hero.tagline` |
| `string[]` | Multiple paragraphs rendered in a loop | `hero.intro`, `books.introFull` |
| `object[]` | Structured data with multiple fields | `books.items` |

**`books.items`** entries support three shapes (all handled by `BooksPage.jsx`):

```json
{ "author": "…", "text": "…" }
{ "author": "…", "paragraphs": ["…", "…", "…"] }
{ "author": "…", "textBefore": "…", "series": ["…", "…"], "textAfter": "…" }
```

### SEO (`index.html`)
- `<title>` and `<meta name="description">` for Google
- `<link rel="canonical">` and `<link rel="sitemap">` 
- `hreflang` tags for EN, NO and `x-default`
- Open Graph tags for rich previews when sharing on LinkedIn etc.
- JSON-LD `Person` schema for Google Knowledge Panel eligibility (includes LinkedIn and GitHub in `sameAs`)

---

## Dark Mode

Default is dark mode. Tailwind's dark mode uses the `.dark` class on `<html>`, configured with:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

The html background colour is also set in CSS (not just Tailwind) to prevent a white flash when overscrolling on mobile.

---

## Deploy

Use the deploy script, passing a commit message as an argument:

```bash
./deploy.sh "Your commit message"
```

This will in order:
1. Build the project (`npm run build`)
2. Upload `dist/` to the Hetzner VPS via `scp`
3. Commit and push all changes to GitHub

Nginx on the server serves the `dist/` folder with `try_files` so React Router's client-side routes (like `/books`) work on direct URL access or page refresh. Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Content-Security-Policy) are configured in the Nginx config. Traffic from nithunmanoharan.com is automatically redirected to nithun.no.

---

## v1 Complete

- [x] Project scaffolded (Vite + React + Tailwind)
- [x] i18n configured (EN + NO)
- [x] Dark/light theme toggle (no flash on load)
- [x] Hero section with photo, tagline, intro
- [x] Books subpage (`/books`) with structured author entries
- [x] Footer with social icon links and build date
- [x] SEO meta tags, Open Graph, JSON-LD schema, sitemap
- [x] WCAG AA accessibility basics (skip link, aria-labels, keyboard navigation)
- [x] Security headers on Nginx
- [x] Deployed to Hetzner VPS
- [x] Domain pointed to server (nithun.no, redirect fra nithunmanoharan.com)
- [x] SSL active (Let's Encrypt)
- [x] Git repository on GitHub
