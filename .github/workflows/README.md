# CI/CD Pipeline

## Jobs

### Route-Layer Tests
- Runs `bun test` on both `backend` and `privacy-proxy`
- Zero network, fast (~15s)
- Tests use inline Elysia handlers with mocked dependencies
- 184 tests total

### Frontend Build
- Builds `Front-end` Next.js app
- Uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID` from GitHub Secrets

### Haweya Build
- Runs `tsc --noEmit` on the Haweya mock OAuth provider
- Compile-time check only (no build step needed)

### Integration Tests
- Spins up **postgres** + **redis** via GitHub Actions `services:`
- Starts backend and privacy-proxy directly with `bun run src/server.ts`
- Runs 24 integration tests against `localhost:4000` (through the proxy)
- All secrets injected from **GitHub Secrets** at runtime

## Required Secrets

Set in Settings → Secrets and variables → Actions:

| Secret | Used By |
|---|---|
| `JWT_SECRET` | Backend JWT signing |
| `PROXY_SECRET` | Proxy ↔ backend trust |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM |
| `GEMINI_API_KEY` | AI complaint validation |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `COSMOS_CHAIN_ID` | Cosmos blockchain selection |
| `COSMOS_BACKEND_MNEMONIC` | Cosmos wallet |
| `R2_ACCOUNT_ID` | Cloudflare R2 file storage |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 file storage |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 file storage |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket |
| `R2_PUBLIC_URL` | Cloudflare R2 public URL |
| `PINATA_JWT` | IPFS pinning via Pinata |

## How It Works

```
GitHub Actions Runner
  ├── postgres:5432 (GHA service container)
  ├── redis:6379 (GHA service container)
  ├── backend:8000 (bun process)
  │   └── connects to postgres + redis
  └── privacy-proxy:4000 (bun process)
      ├── proxies /api/* → backend:8000
      └── connects to redis (rate limiting)

Tests → curl localhost:4000/api/* → proxy forwards → backend responds
```

## Why Not Docker Compose?

The stack deploys via docker-compose locally. CI avoids building all images (cosmos nodes, etc.) by:
1. Using GHA `services:` for postgres + redis
2. Running backend + proxy directly with `bun`
3. Injecting secrets as step-level env vars

This keeps integration tests fast (~55s) and avoids building heavy containers.

## Adding a New Env Var

1. Add it to GitHub Secrets (if secret) or GitHub Variables (if public)
2. Add it to the `env:` block of the relevant step in `ci.yml`
3. For the backend step, add it to the `Start backend` step
