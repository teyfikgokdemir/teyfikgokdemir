# Cansu Dashboard Measurement Design

## Intent

Make the Cansu overview accurately display the GA4, Clarity, and Cloudflare measurements that its APIs already return during the six-site test through 31 December 2026.

## Scope

- Correct the Cloudflare request field from the obsolete `requests24h` path to `last24h.requests`.
- Render top-three GA4 sites from seven-day sessions after `/api/ga4` loads.
- Render top-three Clarity sites from 24-hour sessions after the six project exports load.
- Preserve all APIs, credentials, dashboard layout, and site analytics behavior.

## Approach

The chosen approach keeps source-specific rendering in `cansu-portfolio.js`, where GA4 and Clarity data already arrive, and makes the one-line Cloudflare shape correction in `cansu.astro`. A new API or combined endpoint would duplicate working integrations and add avoidable secret and caching risk.
