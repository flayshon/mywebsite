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

The key is the `access_key` hidden input in `public/contact/index.html`. To
replace it, create a new key at https://web3forms.com/ with the destination
email address and paste it there.

The access key only identifies which inbox receives messages; it is meant to
be placed in HTML and is not a password.

- With JavaScript, `site.js` validates fields inline and submits in the
  background, showing the result on the page.
- Without JavaScript, the browser validates and Web3Forms redirects to
  `/message-sent/`.
- Spam mitigation is a hidden honeypot checkbox (`botcheck`). If spam becomes
  a problem, enable hCaptcha in Web3Forms or move to a Cloudflare Worker with
  Turnstile.

## Analytics

Cloudflare Web Analytics is enabled in the Cloudflare dashboard (Analytics &
Logs → Web Analytics). Cloudflare injects its beacon script into every page
automatically; it doesn't use cookies. The `Content-Security-Policy` in
`public/_headers` allows the script from `static.cloudflareinsights.com`, and
the beacon reports to `/cdn-cgi/rum` on the site's own domain. If you turn
analytics off, remove that host from `script-src`.

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
5. **Force HTTPS.** In the `flayshon.com` zone: **SSL/TLS → Edge
   Certificates → Always Use HTTPS** → on. Without it, `http://` requests are
   served unencrypted instead of being redirected.
6. **Redirect `www` to the bare domain.**
   - **DNS → Records → Add record:** type `A`, name `www`, IPv4 address
     `192.0.2.1`, proxied (orange cloud). The address is a placeholder; the
     redirect below runs before traffic would reach it.
   - **Rules → Redirect Rules:** use the "Redirect from WWW to root" template
     (or create a rule): when hostname equals `www.flayshon.com`, dynamically
     redirect to `concat("https://flayshon.com", http.request.uri.path)` with
     status `301` and "Preserve query string" enabled.
7. **Web Analytics.** Enabled under **Analytics & Logs → Web Analytics** with
   automatic setup, which injects Cloudflare's beacon into every page. The CSP
   in `public/_headers` already allows it (see [Analytics](#analytics)).
8. **Contact form key.** The Web3Forms access key must be in
   `public/contact/index.html` (see [Contact form](#contact-form)); otherwise
   every submission fails.

To verify a deployment:

```sh
curl -sI https://flayshon.com/ | grep -i content-security-policy  # headers applied
curl -sI http://flayshon.com/ | grep -i location                  # → https://flayshon.com/
curl -sI https://www.flayshon.com/contact/ | grep -i location     # → https://flayshon.com/contact/
curl -s -o /dev/null -w '%{http_code}\n' https://flayshon.com/nope  # 404
```

Then send a test message through the contact form and check that it arrives
(look in spam the first time).

Canonical URLs, the sitemap, structured data and the link-preview tags all use
`https://flayshon.com/`. If the domain changes, search the repo for
`flayshon.com` and update them.

Expected cost: the domain (about US$10–11/year). Hosting and the form are free.
