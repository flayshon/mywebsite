# flayshon.com

Personal website of Flávio Melo, software engineer.

Plain HTML and CSS with a small JavaScript file for progressive enhancement.
There is no build step and there are no dependencies: what's in `public/` is
exactly what gets deployed.

## Structure

```
public/
  index.html               Home: short introduction
  experience/index.html    Work experience: Mosyle, freelance services, education
  contact/index.html       Contact form
  about/index.html         About page (photo + personal text)
  message-sent/index.html  Shown after a form submission when JavaScript is off
  404.html                 Not-found page
  styles.css               All styles; design tokens at the top
  site.js                  Theme toggle + contact form enhancement
  images/                  Portrait (AVIF/WebP/JPEG) and link-preview image
  favicon.svg, favicon.ico
  robots.txt, sitemap.xml
  _headers                 Security and cache headers (Cloudflare)
design/og-image.svg        Source for images/og-image.png
scripts/check-size.sh      Reports page weight (raw/gzip/brotli)
wrangler.jsonc             Cloudflare Workers static-assets config
```

Every page shares the same sidebar: `<header class="sidebar-header">` (name,
theme toggle, menu) and `<footer class="sidebar-footer">` (profile links).
They are repeated in each HTML page, so a change to the menu or links must be
made in all six files. The current page's menu link has
`aria-current="page"`.

On wide screens the sidebar is fixed to the left edge; on narrow or short
screens it becomes a header above the content and a footer below it.

## Local development

Any static file server works for editing content:

```sh
python3 -m http.server --directory public 8000
```

To test exactly what Cloudflare serves (headers, 404 page, trailing-slash
redirects), use Wrangler. `npx` downloads it on demand; nothing is added to
the repo:

```sh
npx wrangler@4 dev
```

## Editing notes

**Theme.** The site is light by default. The inline `<script>` in each
page's `<head>` applies a saved dark theme before the first paint, so there is
no flash. That script is allowed by a hash in the `Content-Security-Policy`
in `public/_headers`. If you change the script, it will be blocked until you
update the hash:

```sh
printf '%s' 'try{if(localStorage.getItem("theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}' \
  | openssl dgst -sha256 -binary | base64
```

**Colors.** All colors are tokens at the top of `styles.css`, with the dark
theme under `:root[data-theme="dark"]`. Keep text at 4.5:1 contrast or more
against the background, and form-control borders at 3:1 or more.

**Link-preview image.** Edit `design/og-image.svg`, then:

```sh
rsvg-convert -w 1200 -h 630 design/og-image.svg -o public/images/og-image.png
```

**About page.** The text between the `PLACEHOLDER` comments in
`public/about/index.html` is lorem ipsum and must be replaced.

## Contact form

The form posts to [Web3Forms](https://web3forms.com/) (free plan: 250
submissions per month), which emails each message to the address registered
with the access key.

1. Create an access key at https://web3forms.com/ using your email address.
2. Replace `YOUR_WEB3FORMS_ACCESS_KEY` in `public/contact/index.html`.

The access key only identifies which inbox receives messages; it is meant to
be placed in HTML and is not a password.

- With JavaScript, `site.js` validates fields inline and submits in the
  background, showing the result on the page.
- Without JavaScript, the browser validates and Web3Forms redirects to
  `/message-sent/`.
- Spam mitigation is a hidden honeypot checkbox (`botcheck`). If spam becomes
  a problem, enable hCaptcha in Web3Forms or move to a Cloudflare Worker with
  Turnstile.

## Checks

```sh
scripts/check-size.sh          # page weight against the budgets below
```

Run against the local Wrangler server or the live site:

```sh
CHROME_PATH=/usr/bin/chromium npx lighthouse@12 http://127.0.0.1:8787/ --view
```

HTML can be validated at https://validator.w3.org/nu/. Also test manually:
keyboard-only navigation, both themes, JavaScript disabled, and a 320px-wide
window.

Performance budgets (compressed):

| Measure                            | Budget  |
|------------------------------------|---------|
| Any page's HTML                    | ≤ 10 KB |
| HTML + CSS needed to render a page | ≤ 14 KB |
| JavaScript                         | ≤ 2 KB  |
| Home page total                    | ≤ 30 KB |
| About page total (with photo)      | ≤ 45 KB |

## Deployment (Cloudflare)

1. Push this repository to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Import a
   repository**, and select it. Leave the build command empty; the deploy
   command is `npx wrangler deploy`.
3. Every push to `main` deploys automatically. The site is available on a
   `*.workers.dev` address right away.
4. Buy `flayshon.com` (Cloudflare Registrar sells at cost), then add it under
   the Worker's **Settings → Domains & Routes → Custom domain**. HTTPS is set
   up automatically.

Canonical URLs, the sitemap, structured data and the link-preview tags all use
`https://flayshon.com/`. If the domain changes, search the repo for
`flayshon.com` and update them.

Expected cost: the domain (about US$10–11/year). Hosting and the form are free.
