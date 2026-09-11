# Growth OS

Private growth intelligence and execution platform for teyfikgokdemir.com.

## Current core (v0.8)
- Website audit: technical SEO, on-page SEO, schema, GEO/AEO/AIO readiness, conversion and tracking signals
- Re-audit / Final Check with score delta, fixed/open/new issue comparison
- Project portfolio and per-project control center
- Ads readiness plus Google Ads / Meta Ads / TikTok Ads integration status layer
- Analytics campaign-metric view with spend, attributed revenue, ROAS, clicks and conversions
- CRM pipeline view with lead source, owner, status, value and won revenue
- Profit engine with editable ROAS / CPA / MER / margin / return / shipping / fee targets
- Audit-generated critical alerts and prioritized recommendations
- Approval-based recommendation queue and immutable action log
- Private production access through Cloudflare Access

## Safety model
External ad/platform execution is intentionally not automatic. Recommendations first enter an approval queue. Connected provider credentials are required before any future execution adapter can perform an external action.

## Local / server run
1. Copy `.env.example` to `.env`.
2. Run `docker compose up --build` from this directory.
3. Web: http://localhost:3000
4. API: http://localhost:4000/health

## Production
Railway services deploy from the `growth-os` branch. Web root: `/growth-os/apps/web`; API root: `/growth-os/apps/api`. The public application hostname is protected by Cloudflare Access.
