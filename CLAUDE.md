# CLAUDE.md

Personal portfolio site for Flávio Melo (software engineer), live at
https://flayshon.com. Read `README.md` for structure, editing notes,
deployment and checks; this file covers what to keep in mind when changing it.

## Ground rules

- **Plain static site, on purpose.** HTML, CSS and one small `site.js` in
  `public/`. No build step, no framework, no `package.json`, no runtime
  dependencies. Don't introduce any of these (or a static site generator)
  without discussing it first. Testing tools run on demand via `npx` and are
  never added to the repo.
- **Discuss before material changes.** Layout, architecture, new
  dependencies, new third-party services or new pages: propose first, implement
  after approval. Small requested edits can go straight ahead.
- **Don't commit or push unless asked.** Every push to `main` deploys to
  production through Cloudflare.
- **Content must be real.** Never invent experience, metrics, employers,
  testimonials or skills. Mosyle bullets follow the résumé wording (active
  voice); the job title is "Backend Software Developer" with no seniority
  level. Ask before adding any new claim. Never publish the phone number.
- **Private files stay out of git.** `PROJECT_BRIEF.md`, the résumé PDF and the
  original photo are gitignored; keep it that way.

## Things that are easy to break

- **The sidebar is duplicated in all six HTML pages** (`index.html`,
  `experience/`, `contact/`, `about/`, `message-sent/`, `404.html`). Menu or
  link changes must be applied to every file, keeping `aria-current="page"` on
  the current page's menu link.
- **The inline theme script in `<head>` is allowed by a CSP hash** in
  `public/_headers`. Changing that script by even one character breaks the
  theme until the hash is updated (command in README).
- **CSP is strict** (`default-src 'none'`). Any new external origin (script,
  image, font, form endpoint) needs a matching directive in `public/_headers`,
  or it will be blocked in production. Current allowances: Web3Forms
  (`connect-src`, `form-action`) and the Cloudflare Web Analytics beacon
  (`script-src`).
- **Light theme is the default** and the OS color preference is intentionally
  ignored. Dark mode only applies after the visitor uses the toggle.
- **Without JavaScript the site must still work**: content renders, the form
  posts natively and redirects to `/message-sent/`, and the theme toggle stays
  hidden (it uses `visibility: hidden` to reserve its space and avoid layout
  shift).
- **URLs use `https://flayshon.com/`** in canonical tags, Open Graph tags,
  JSON-LD and `sitemap.xml`. Adding or removing a page means updating the
  sitemap; no-index pages (`message-sent`, `404`) stay out of it.

## Design conventions

- Visual reference is taniarascia.com: fixed left sidebar on wide screens
  (menu at the top, "Elsewhere" links at the bottom), content on the right,
  each section on its own page.
- Colors are tokens at the top of `styles.css`; light background `#f8f4e6`,
  primary `#3254a8`, navy dark theme. New colors must meet WCAG AA contrast
  (4.5:1 text, 3:1 control borders) in both themes.
- System fonts only. Minimal outline SVG icons (inline, `currentColor`).
  No gradients, decorative shadows, skill bars or animations beyond short
  color transitions (disabled under `prefers-reduced-motion`).

## Verifying changes

Before reporting a change as done:

1. `scripts/check-size.sh` — stay within the budgets listed in the README
   (HTML + CSS to render a page ≤ 14 KB compressed).
2. Run the site with `npx wrangler@4 dev` and check the affected pages in both
   themes, at 320px width and with the keyboard.
3. Validate changed HTML/CSS (https://validator.w3.org/nu/) and run Lighthouse
   (`CHROME_PATH=/usr/bin/chromium npx lighthouse@12 <url>`); the target is 100
   in every category with zero layout shift.

Report what was actually verified; don't claim a check passed without running
it.
