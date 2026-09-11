# Growth OS test deployment

## Target
- Private dashboard: `growth.teyfikgokdemir.com`
- API: `growth-api.teyfikgokdemir.com`
- Branch: `growth-os`
- Trial runtime: Railway 30-day trial / $5 one-time trial credit

## Railway services (current 2026 setup)
Railway's legacy `railway.json` / `railway.toml` Config-as-Code flow is deprecated for new services. Use separate services with root directories, or Railway Infrastructure as Code after the project exists.

### 1. `growth-web`
- Source repo: `teyfikgokdemir/teyfikgokdemir`
- Branch: `growth-os`
- Root Directory: `/growth-os/apps/web`
- Railway detects `/growth-os/apps/web/Dockerfile`
- Environment: `NEXT_PUBLIC_API_URL=https://growth-api.teyfikgokdemir.com`
- Public/custom domain: `growth.teyfikgokdemir.com`

### 2. `growth-api`
- Source repo: `teyfikgokdemir/teyfikgokdemir`
- Branch: `growth-os`
- Root Directory: `/growth-os/apps/api`
- Railway detects `/growth-os/apps/api/Dockerfile`
- Environment: `DATABASE_URL=<Postgres DATABASE_URL>`
- Railway supplies `PORT`; application falls back to 4000 locally
- Healthcheck: `/health`
- Public/custom domain during test: `growth-api.teyfikgokdemir.com`

### 3. PostgreSQL
- Managed Railway Postgres during trial/testing
- Stores projects, audits, CRM, campaign metrics, targets, alerts, recommendations and action logs

### 4. Worker services (later in trial)
Create separate long-running services for ads sync, alert evaluation and scheduled audit jobs after their code exists. Keep write-capable advertising connectors disabled by default.

## Cloudflare
- Route `growth.teyfikgokdemir.com` and `growth-api.teyfikgokdemir.com` after Railway assigns service domains.
- Put the dashboard behind Cloudflare Access.
- Keep the application `noindex`.
- Do not expose database/Redis publicly.
- API authentication is required before production; later webhook endpoints get separate signed/public policies.

## Deployment procedure
1. Start Railway trial and connect GitHub for full-trial verification.
2. Create an empty project.
3. Add PostgreSQL.
4. Add two services from the private GitHub repo/`growth-os` branch.
5. Set each service Root Directory as documented above.
6. Configure environment variables.
7. Deploy API first and verify `/health`.
8. Deploy web with the API URL.
9. Assign temporary Railway domains and run end-to-end tests.
10. Add the two `teyfikgokdemir.com` custom subdomains.
11. Protect dashboard access through Cloudflare Access before real customer data is added.

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
- Action log and rollback payload validated
- Backups/export procedure validated
