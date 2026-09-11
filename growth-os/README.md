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

## Google connector
Growth OS contains a server-side OAuth connector for Google services. A single consent flow requests access for:
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

### Connector API
- `POST /projects/:id/integrations/google/connect` returns the Google authorization URL.
- `GET /oauth/google/callback` verifies the one-time OAuth state, exchanges the code and stores the encrypted refresh token.
- `GET /projects/:id/integrations/google/resources` discovers accessible Google Ads customers, GA4 accounts/properties, Search Console properties and Merchant Center accounts.

The next layer is account/resource assignment: choosing which discovered Google Ads customer, GA4 property, Search Console property and Merchant account belong to a Growth OS project, followed by scheduled read-only synchronization.

## Safety model
External ad/platform execution is intentionally not automatic. Recommendations first enter an approval queue. Connected provider credentials are required before any future execution adapter can perform an external action.

## Local / server run
1. Copy `.env.example` to `.env`.
2. Run `docker compose up --build` from this directory.
3. Web: http://localhost:3000
4. API: http://localhost:4000/health

## Production
Railway services deploy from the `growth-os` branch. Web root: `/growth-os/apps/web`; API root: `/growth-os/apps/api`. The public application hostname is protected by Cloudflare Access.
