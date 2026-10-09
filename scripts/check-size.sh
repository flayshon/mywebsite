#!/usr/bin/env sh
# Reports raw, gzip and brotli sizes for the site's text files and totals per page.
# Usage: scripts/check-size.sh
set -eu
cd "$(dirname "$0")/../public"

size() { wc -c < "$1" | tr -d ' '; }
gz() { gzip -9 -c "$1" | wc -c | tr -d ' '; }
br() { brotli -q 11 -c "$1" | wc -c | tr -d ' '; }

printf '%-28s %8s %8s %8s\n' file raw gzip brotli
for f in index.html experience/index.html contact/index.html about/index.html 404.html message-sent/index.html styles.css site.js; do
  printf '%-28s %8s %8s %8s\n' "$f" "$(size "$f")" "$(gz "$f")" "$(br "$f")"
done

echo
echo "Critical path (HTML + CSS, gzip) — budget 14336 bytes:"
for f in index.html contact/index.html about/index.html; do
  printf '  %-26s %8s\n' "$f" $(( $(gz "$f") + $(gz styles.css) ))
done

echo
echo "Home total (gzip HTML + CSS + JS, favicon.svg):"
printf '  %8s bytes\n' $(( $(gz index.html) + $(gz styles.css) + $(gz site.js) + $(size favicon.svg) ))
echo "About total (gzip HTML + CSS + JS, favicon.svg, AVIF photo):"
printf '  %8s bytes\n' $(( $(gz about/index.html) + $(gz styles.css) + $(gz site.js) + $(size favicon.svg) + $(size images/flavio-melo.avif) ))
