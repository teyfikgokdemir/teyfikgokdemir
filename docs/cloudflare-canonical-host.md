# Cloudflare canonical host redirects

Production must expose one canonical host: `https://teyfikgokdemir.com`.

Cloudflare Pages `_redirects` handles the root language decision and generated
path-level trailing-slash redirects. The `www` hostname rule belongs in the
Cloudflare zone because Pages `_redirects` cannot reliably enforce a host-level
redirect for every custom-domain request.

Create these Cloudflare **Single Redirects** before publishing this branch,
in this order:

- Menu: **Cloudflare dashboard → teyfikgokdemir.com → Rules → Redirect Rules
  → Single Redirects**
- Root rule expression:
  `(http.host in {"teyfikgokdemir.com" "www.teyfikgokdemir.com"} and http.request.uri.path eq "/")`
- Root target: `https://teyfikgokdemir.com/tr/`
- Root status: `301`; preserve the original query string
- Host/scheme rule expression:
  `((http.host eq "www.teyfikgokdemir.com" or starts_with(http.request.full_uri, "http://")) and http.request.uri.path ne "/")`
- Status: `301` (permanent)
- Dynamic target expression:
  `concat("https://teyfikgokdemir.com", http.request.uri.path)`
- Query string: preserve the original query string

These rules let `http://teyfikgokdemir.com/` reach `/tr/` in one hop instead of
first stopping at the HTTPS root. Validate the root, a language page, a blog
page, and a URL with a query string after deployment. Each test must have one
permanent redirect at most and must end on the HTTPS, non-www, trailing-slash
URL.

This repository does not deploy or change the Cloudflare zone rule itself.
