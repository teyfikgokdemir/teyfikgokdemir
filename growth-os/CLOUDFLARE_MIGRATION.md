# Growth OS — Cloudflare migration workstream (2026-10-15)

Status: discovery and isolation only. **No production cutover authorized by this document.**

## Verified source and runtime

- Source: `teyfikgokdemir/teyfikgokdemir`, branch `growth-os`.
- Railway project: `Growth OS`; `growth-web`, `growth-api`, `Postgres` are offline (2026-10-15 API inspection).
- A persistent Railway PostgreSQL volume `postgres-volume` (500 MB provisioned), attached to `Postgres` at `/var/lib/postgresql/data`, still exists; **the contents and recoverability are not verified**.
- Railway build logs also show historical source compilation errors (web JSX error on 2026-09-13, API TypeScript error on 2026-09-16). Do not attribute every failed deployment solely to trial expiration.
- Cloudflare Access currently protects `growth.teyfikgokdemir.com`; preserve until a validated equivalent login exists.
- DNS for production points to Railway. Do not modify production DNS before safe cutover and rollback checks.
- API uses Express / PostgreSQL `pg` and verifies Cloudflare Access JWT in production. OAuth refresh tokens are encrypted in DB. Publicly exposing the legacy app or its Railway service URLs is unsafe.

## Migration constraints

1. **Do not delete Railway project/volume, rotate encryption keys, or alter production DNS/Access.** First export and verify Postgres using a supported recovery path; keep original encrypted credentials safely.
2. Keep platform changes independent from feature additions. Start with an isolated preview hostname, restricted using Access.
3. Evaluate current Next.js frontend against vinext (recommended by Cloudflare as of 2026-10-12) and OpenNext as fallback; compare compile/runtime compatibility rather than assuming a drop-in deploy.
4. Backend Express cannot be declared Workers-compatible without compile, runtime and integration tests. Consider an adapter / request handler conversion; preserve JWT verification and per-workspace authorization.
5. Retain PostgreSQL initially. External provider/Hyperdrive choice requires testing and pricing verification; no D1 schema rewrite in initial migration.
6. For any OAuth tests, register preview redirect URI explicitly, use isolated credentials where possible, and avoid copying production refresh tokens into a public environment.
7. CI gate: API typecheck/build, frontend build, tests, auth-denial tests, DB migration read/write tests against expendable test data, OAuth callback state validation, SSR/proxy tests, before deployment.
8. Cutover gate: confirmed backup and restore; authenticated preview; API connectivity; Cloudflare Access JWT validity; smoke tests; rollback plan and fixed source commit SHA.

## Known immediate blockers

- PostgreSQL is offline and the attached volume alone does not prove restorable data.
- Local source build cannot be certified from GitHub file inspection alone.
- Production integrations should remain read-only.
- Existing `growth-os` branch remains unchanged by this workstream.

## Phase tracking

- [x] Verify source repository/branch and deployment inventory.
- [x] Verify Railway volume still exists (metadata only).
- [x] Identify production access and DNS boundaries.
- [x] Create independent migration branch.
- [ ] Recover or export PostgreSQL safely; test a restore.
- [ ] Reproduce current frontend/backend builds at exact SHA.
- [ ] Adapt frontend and backend in isolated commits.
- [ ] Deploy private Cloudflare preview; perform authentication and functional smoke tests.
- [ ] Cut over DNS only after backup, successful preview and rollback readiness.
