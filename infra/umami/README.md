# Cansu / Umami self-hosting

Target hostname: `analytics.teyfikgokdemir.com`

This directory contains the production-oriented Docker Compose scaffold for the self-hosted Umami instance used by Cansu Operations Center.

## Requirements

- Linux host with Docker + Docker Compose
- DNS record for `analytics.teyfikgokdemir.com`
- HTTPS reverse proxy (Cloudflare + Nginx/Caddy is suitable)

## Start

1. Copy `.env.example` to `.env`.
2. Generate secrets:
   - `openssl rand -hex 32` for APP_SECRET
   - generate a separate long PostgreSQL password
3. Run `docker compose up -d`.
4. Reverse proxy HTTPS traffic from `analytics.teyfikgokdemir.com` to `127.0.0.1:3000`.
5. Login with the initial Umami credentials and immediately change the password.
6. Create six websites:
   - teyfikgokdemir.com
   - ctseg.com.tr
   - mythborn.co
   - qctstudio.com
   - qctcommerce.com
   - olivon.com.tr
7. Create an Umami API key.
8. Set these Cloudflare Pages secrets on the teyfikgokdemir project:
   - `UMAMI_BASE_URL=https://analytics.teyfikgokdemir.com`
   - `UMAMI_API_KEY=<api key>`

Once those two secrets are present, Cansu's `/api/umami` endpoint and the generic tracker loader activate automatically.

The tracker loader also enables Umami performance collection and respects Do Not Track.
