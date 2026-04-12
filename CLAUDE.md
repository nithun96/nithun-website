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
Website Project/
├── index.html              # Entry point — SEO, Open Graph, JSON-LD, dark mode init script
├── vite.config.js          # Vite config — plugins, build date injection (__BUILD_DATE__)
├── deploy.sh               # Deploy: build → scp to server → git commit + push
├── scripts/
│   └── generate-sitemap.js # Auto-generates public/sitemap.xml with today's date at build time
├── public/
│   ├── favicon.svg         # Custom NM favicon
│   ├── sitemap.xml         # Generated at build time — do not edit manually
│   └── images/
│       └── nithun.jpeg     # Profile photo (optimised)
└── src/
    ├── main.jsx            # Bootstrap — BrowserRouter + i18n init
    ├── App.jsx             # Root layout — Navbar, Routes, Footer
    ├── i18n.js             # i18next config — EN/NO, language detection
    ├── styles/
    │   └── global.css      # Tailwind import, dark mode variant, font variables
    ├── components/
    │   ├── Navbar.jsx      # Navigation bar
    │   ├── Footer.jsx      # Footer with social links and build date
    │   ├── ThemeToggle.jsx # Dark/light toggle with SVG icons
    │   └── LangToggle.jsx  # EN/NO language toggle
    ├── sections/
    │   └── Hero.jsx        # Home page — photo, name, tagline, intro
    ├── pages/
    │   └── BooksPage.jsx   # /books — author entries with three rendering modes
    └── locales/
        ├── en/translation.json
        └── no/translation.json
```

---

## Deployment (Hetzner)

To deploy changes, use the deploy script with a commit message:

```
./deploy.sh "Your commit message"
```

This will build, upload to the server, and push to GitHub in one command.

The site is live at **nithun.no** (primary domain). Traffic from nithunmanoharan.com automatically redirects to nithun.no.

**Important:** After every change session, run `./deploy.sh` with a descriptive commit message to deploy to the live server.

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

## Current Status (v1 complete)

- [x] Project scaffolded (Vite + React + Tailwind)
- [x] i18n configured (EN + NO)
- [x] Dark/light theme toggle (no flash on load)
- [x] Hero section with photo, tagline, intro
- [x] Books subpage (/books) with structured author entries
- [x] Footer with social icon links and build date
- [x] SEO meta tags, Open Graph, JSON-LD schema, sitemap (auto-generated)
- [x] WCAG AA accessibility basics
- [x] Security headers on Nginx
- [x] Deployed to Hetzner VPS
- [x] Live at nithun.no (redirect from nithunmanoharan.com)
- [x] SSL active (Let's Encrypt)
- [x] Git repository on GitHub
