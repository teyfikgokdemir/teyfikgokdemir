# Growth OS test deployment

## Target
- Private dashboard: `growth.teyfikgokdemir.com`
- API: `growth-api.teyfikgokdemir.com`
- Branch: `growth-os`
- Trial runtime: Railway 30-day trial

## Railway services
1. `growth-web`
   - Source repo: `teyfikgokdemir/teyfikgokdemir`
   - Branch: `growth-os`
   - Config file: `/growth-os/railway.web.json`
   - Env: `NEXT_PUBLIC_API_URL=https://growth-api.teyfikgokdemir.com`

2. `growth-api`
   - Source repo: `teyfikgokdemir/teyfikgokdemir`
   - Branch: `growth-os`
   - Config file: `/growth-os/railway.api.json`
   - Env: `DATABASE_URL=<Railway Postgres DATABASE_URL>`
   - Env: `PORT=4000`

3. PostgreSQL
   - Railway managed Postgres during test
   - Keep all audit/project history here

## Cloudflare
- Create CNAME/custom-domain routing for `growth.teyfikgokdemir.com` and `growth-api.teyfikgokdemir.com` after Railway assigns service domains.
- Put `growth.teyfikgokdemir.com/*` behind Cloudflare Access.
- API should not be broadly exposed once auth is added; webhook routes will later receive their own signed/public policies.

## Test exit criteria before paid infrastructure
- Web and API CI green
- Domain audit succeeds on representative sites
- Multi-page crawl results validated
- Audit history and Final Check comparison validated
- SSRF/private-network protections tested
- Auth/Access enabled
- Meta/Google/TikTok connectors tested in read-only mode
- CRM, ROAS, profit and alert calculations validated
- Action engine requires explicit approval by default
