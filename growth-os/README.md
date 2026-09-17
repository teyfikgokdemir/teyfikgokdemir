# Growth OS

Private growth intelligence and execution-control platform for teyfikgokdemir.com.

## Current core (v1)
- Website audit: technical SEO, on-page SEO, schema, GEO/AEO/AIO readiness, conversion and tracking signals
- Re-audit / Final Check with score delta and non-overlapping fixed / still-open / new / regressed issue categories
- Project portfolio, lifecycle controls and per-project control center
- Google Ads / Meta Ads / TikTok Ads integration status and read-only data layer
- GA4, Search Console and Merchant Center resource discovery and explicit project assignment
- Bounded pagination and partial/truncated-data signalling for supported Google, Meta and analytics discovery/reporting flows
- Analytics campaign-metric view with spend, attributed revenue, ROAS, clicks and conversions
- CRM pipeline view with lead source, owner, status, value and won revenue
- Profit engine with editable ROAS / CPA / MER / margin / return / shipping / fee targets
- Audit-generated critical alerts and prioritized recommendations
- Approval-based recommendation queue and immutable action log
- Private production access through Cloudflare Access

## Google connector
Growth OS contains a server-side OAuth connector for Google services. A single consent flow requests read access for:
- Google Ads API
- Google Analytics (GA4) Admin/Data API
- Google Search Console API
- Google Merchant API

Refresh tokens are encrypted with AES-256-GCM before being stored in PostgreSQL. Browser/client code never receives or stores the refresh token.

### Google Cloud setup
1. Create/select one Google Cloud project for Growth OS.
2. Configure the OAuth consent screen.
3. Enable Google Ads API, Google Analytics Admin/Data API, Search Console API and Merchant API.
4. Create an OAuth 2.0 Web application client.
5. Add the production redirect URI:
   `https://growth.teyfikgokdemir.com/api/growth/oauth/google/callback`
6. Configure Railway API variables:
   - `APP_BASE_URL=https://growth.teyfikgokdemir.com`
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `GOOGLE_REDIRECT_URI=https://growth.teyfikgokdemir.com/api/growth/oauth/google/callback`
   - `GOOGLE_ADS_API_VERSION=v22`
   - `INTEGRATION_ENCRYPTION_KEY=<long random secret>`

Do not place real secret values in source control or documentation.

### Resource assignment and data safety
Growth OS can discover accessible Google Ads customers, GA4 properties, Search Console properties and Merchant Center accounts, then persist explicit project selections where supported.

Selection and read flows are designed to fail safely:
- an inaccessible/stale explicit selection must not silently fall back to another account/property;
- partial or safety-limited datasets must be surfaced as partial rather than presented as complete;
- malformed or failed upstream responses must not be treated as legitimate zero-data responses;
- connector error handling must not expose refresh tokens, access tokens or raw credential-bearing payloads to the browser.

Search Console detail pagination is bounded. Summary totals use the appropriate aggregate query rather than treating the first page of detail rows as the site total.

## Safety model
Growth OS v1 remains read-only for external advertising platforms.

External write execution is fail-closed and requires all applicable gates. In particular, both `EXTERNAL_EXECUTION_ENABLED=true` and `ADS_WRITE_ENABLED=true` are required before the global write gate can open, in addition to project policy, provider allowlisting and manual approval where configured.

Production policy is to keep external ad writes disabled. Growth OS must not publish ads, mutate budgets or creatives, or perform other external advertising mutations as part of the v1 read-only operating mode.

## CI and deployment gate
Changes on the `growth-os` branch are released with an exact-SHA gate. Before starting the next unrelated change, the current commit must have all three checks green:
1. GitHub `Growth OS CI` = completed/success
2. Railway `Growth OS - growth-api` = success
3. Railway `Growth OS - growth-web` = success

CI includes build/tests plus regression guards for critical safety and integration invariants such as bounded pagination, audit comparison semantics, proxy bounds, Cloudflare JWKS rotation handling and external execution write gates.

## Local / server run
1. Copy `.env.example` to `.env`.
2. Run `docker compose up --build` from this directory.
3. Web: http://localhost:3000
4. API: http://localhost:4000/health

## Production
Production URL: `https://growth.teyfikgokdemir.com`

Railway services deploy from the `growth-os` branch:
- Web root: `/growth-os/apps/web`
- API root: `/growth-os/apps/api`
- PostgreSQL: Railway Postgres service

The production application hostname is protected by Cloudflare Access.
