# Sawtak - Anonymous Whistleblowing Platform
A secure platform that lets citizens anonymously report misconduct and corruption, with cryptographic guarantees of data integrity and privacy.

[![Quick Start](https://img.shields.io/badge/▶_Quick_Start-2ea44f?style=for-the-badge)](#quick-start)
[![API Docs](https://img.shields.io/badge/📖_API_Endpoints-1f6feb?style=for-the-badge)](#api-endpoints)
[![Testing](https://img.shields.io/badge/🧪_Testing-6f42c1?style=for-the-badge)](#testing)
[![Monitoring](https://img.shields.io/badge/📊_Monitoring-dc3545?style=for-the-badge)](#monitoring)
[![Architecture](https://img.shields.io/badge/🏗_Architecture-343a40?style=for-the-badge)](#architecture)
[![Security](https://img.shields.io/badge/🔒_Security-e67e22?style=for-the-badge)](#security)

---

## Architecture

Sawtak is split across four network trust zones — no component outside its zone can talk directly to components in a more trusted zone.

```text
                                    PUBLIC INTERNET
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────────────────┐   │
│  │  Browser  │  │  Mobile  │  │   Admin   │  │  Haweya (Nat'l ID OAuth)     │   │
│  │ (Citizen) │  │(Citizen) │  │(Official) │  │                              │   │
│  └─────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────────────┬───────────────┘   │
└────────┼─────────────┼──────────────┼───────────────────────┼───────────────────┘
         │             │              │                       │
         ▼             ▼              ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DMZ — PRIVACY PROXY  :4000                                                     │
│  (only public endpoint — all external traffic enters here)                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Request Ingress ──→ Security Policy Engine ──→ Upstream Forwarder ──►  │    │
│  │                              │                  │                       │    │
│  │                     ┌────────┴───────┐   ┌──────┴───────┐               │    │
│  │                     │   Anonymous    │   │  Sanitizer   │               │    │
│  │                     │    Session     │   │  / Metadata  │               │    │
│  │                     │   Management   │   │   Stripper   │               │    │
│  │                     └────────┬───────┘   └──────┬───────┘               │    │
│  │                              │                  │                       │    │
│  │                     ┌────────┴──────────────────┴───────┐               │    │
│  │                     │         Identity Anonymizer       │               │    │
│  │                     └───────────────────────────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Redis Store  :6379                              ┌──────────────────┐   │    │
│  │  ┌───────────────────┐  ┌──────────────────┐     │   Rate Limiter   │   │    │
│  │  │ Sessions / Cache  │  │   Rate Limit     │     │ (Sliding Window) │   │    │
│  │  └───────────────────┘  │    Counters      │     └──────────────────┘   │    │
│  │                         └──────────────────┘                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────────────┘
                                      │ internal network (sawtak_internal)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  INTERNAL — BACKEND  :8000  (proxy-auth required, no external exposure)         │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Middleware Layer                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐    │    │
│  │  │ Proxy Auth  │  │ Auth (JWT)  │  │CORS / Helmet│  │ Teams / RBAC │    │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Services                                                               │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────┐   │    │
│  │  │    Anonymous    │  │   Identified    │  │   AI Content Filter    │   │    │
│  │  │   Submission    │  │   Submission    │  │  (Gemini Spam Check)   │   │    │
│  │  └────────┬────────┘  └────────┬────────┘  └───────────┬────────────┘   │    │
│  │           │                    │                       │                │    │
│  │  ┌────────┴────────────────────┴───────────────────────┴────────────┐   │    │
│  │  │          Auth Service (Google OAuth / Haweya OAuth / JWT)        │   │    │
│  │  └──────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐    │    │
│  │  │Feed Service │  │Vote Service │  │ Admin Panel │  │   Evidence   │    │    │
│  │  │             │  │             │  │             │  │  Upload (R2) │    │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Data Stores (internal)                                                 │    │
│  │  ┌───────────────────────────────────┐  ┌──────────────────────────┐    │    │
│  │  │  PostgreSQL  :5432                │  │  Cosmos Indexer          │    │    │
│  │  │  ┌──────────┐  ┌───────────────┐  │  │  (polls blockchain events│    │    │
│  │  │  │  Users   │  │  Identified   │  │  │   → writes indexed data  │    │    │
│  │  │  ├──────────┤  │  Complaints   │  │  │   to Postgres)           │    │    │
│  │  │  │Anonymous │  ├───────────────┤  │  └──────────────────────────┘    │    │
│  │  │  │ Tracking │  │  Audit Logs   │  │                                  │    │
│  │  │  └──────────┘  └───────────────┘  │                                  │    │
│  │  └───────────────────────────────────┘                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  External Integrations                                                  │    │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────┐  │    │
│  │  │     Pinata IPFS      │  │     Cloudflare R2    │  │ Haweya OAuth  │  │    │
│  │  │  (anon. evidence —   │  │  (ident. evidence —  │  │ (National ID) │  │    │
│  │  │   CID goes on-chain) │  │   private, no chain) │  │               │  │    │
│  │  └──────────────────────┘  └──────────────────────┘  └───────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────────────┘
                                      │ gRPC / REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  BLOCKCHAIN — Sawtak POA Testnet                                                │
│  (3× Cosmos SDK validators, Proof of Authority consensus)                       │
│                                                                                 │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐  │
│  │  Node 1  (Genesis)    │  │  Node 2  (Validator)  │  │  Node 3  (Val.)     │  │
│  │                       │  │                       │  │                     │  │
│  │  REST :1317           │  │  REST :1318           │  │  REST :1319         │  │
│  │  RPC  :26657          │◄─┤  RPC  :26658          │◄─┤  RPC  :26659        │  │
│  │  gRPC :9090           │  │  gRPC :9091           │  │  gRPC :9092         │  │
│  │  P2P  :26656          │  │  P2P  :26656          │  │  P2P  :26656        │  │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────────┘  │
│                                                                                 │
│  Only pre-approved validators produce blocks. No public staking or inflation.   │
│  Anonymous complaints stored on-chain with cryptographic proof of submission.   │
└─────────────────────────────────────┬───────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  MONITORING — Prometheus + Grafana                                              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Prometheus :19100  ──scrapes──→  Proxy :4000  +  Backend :8000         │    │
│  │       │                                                                 │    │
│  │       ├── Redis Exporter    :9121  (connected clients, memory, commands)│    │
│  │       └── Postgres Exporter :9187  (connections, queries, deadlocks)    │    │
│  │                                                                         │    │
│  │  Grafana :3100  ←── Prometheus ──→  Pre-built dashboards                │    │
│  │  Alertmanager  ──→  Email / Webhook notifications                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘

### Trust Zones

| Zone           | Services                          | Accessible From         | Entry Points           |
|----------------|-----------------------------------|-------------------------|------------------------|
| **Public**     | Browser, Mobile, Admin, Haweya    | Internet                | 443 (HTTPS)            |
| **DMZ**        | Privacy Proxy, Redis              | Internet :4000 only     | `proxy:4000`           |
| **Internal**   | Backend, PostgreSQL               | Proxy only (proxy-auth) | `backend:8000`         |
| **Blockchain** | 3× Cosmos POA Nodes               | Backend only (REST/gRPC)| `:1317–1319`           |
| **Monitoring** | Prometheus, Grafana, Exporters    | Admin network only      | `:19100`, `:3100`      |

### Request Flow (Detailed)

  ┌─────┐  POST /api/complaints/anonymous/submit
  │User │  (full headers: IP, UA, cookies, ...)
  └──┬──┘
     │
     ▼
┌──────────┐  1. Resolve/create anonymous session ID
│ PRIVACY  │  2. Check rate limits (Redis sliding window)
│  PROXY   │  3. Strip: x-forwarded-for, x-real-ip, user-agent, referer, cookies
│  :4000   │  4. Replace User-Agent with "Sawtak-Proxy/1.0"
│          │  5. Inject X-Proxy-Secret, X-Proxy-Session-Id
└────┬─────┘
     │  sanitized request (no PII)
     ▼
┌──────────┐  6. Verify proxy auth (X-Proxy-Secret)
│ BACKEND  │  7. JWT authentication (if required)
│  :8000   │  8. AI (LLM Based) content validation (spam, ads, invalid content)
│          │  9. Route to service
└────┬─────┘
     │
     ├──→ ANONYMOUS ──→ IPFS/Pinata (upload evidence, receive CID)
     │                       │
     │                       └──[CID in payload]──→ Cosmos POA Chain :1317
     │                                                       │
     │                                                       └──→ Indexer ──→ Postgres
     │
     └──→ IDENTIFIED ──→ Postgres (AES-256-GCM encrypted)
                             │
                             └──→ Cloudflare R2 (evidence, private)

                             

### Key Design Decisions

- **Privacy Proxy is the only public entrypoint** — the backend listens on an internal network with no external exposure. Proxy auth (`X-Proxy-Secret`) ensures even if an internal service is compromised, forged requests are rejected.
- **Redis lives in the DMZ with the proxy** — rate limit counters and session data never leave the proxy layer. The backend only talks to Postgres.
- **No IP logging at any layer** — the proxy strips IPs before forwarding and logs only session IDs. The backend never sees a client IP.
- **IPFS before chain for anonymous submissions** — evidence is uploaded to IPFS/Pinata first, and the returned CID is embedded in the on-chain payload. This keeps large files off the chain while preserving a tamper-evident reference.
- **Identified evidence never touches IPFS or the chain** — evidence for identified complaints is stored privately in Cloudflare R2 and never committed to the public blockchain.
- **AI validation before persistence** — Gemini API filters spam, advertising, and invalid content before anything hits the database or chain.

## How Privacy & Anonymity Work

### What the Proxy Strips

| Header             | Action                   | Why                      |
|--------------------|--------------------------|--------------------------|
| `x-forwarded-for`  | Removed                  | Client IP leak           |
| `x-real-ip`        | Removed                  | Client IP leak           |
| `cf-connecting-ip` | Removed                  | Cloudflare client IP     |
| `user-agent`       | Replaced with generic    | Browser fingerprinting   |
| `referer`          | Removed                  | Origin tracking          |
| `cookie`           | Stripped (non-session)   | Cross-service tracking   |

### Cryptographic Guarantees

- **Anonymous submissions** stored on Sawtak blockchain — immutable, publicly verifiable
- **Evidence CIDs** committed on-chain — IPFS content addressed, tamper-evident
- **User identity** encrypted with AES-256-GCM before any blockchain submission
- **Tracking codes** use SHA-256 hashes — no way to reverse back to submitter
- **Proof of submission** cryptographically signed with platform's private key
- **No IP logging** — backend operates on internal network, proxy never logs IPs

### Dual-Mode Submissions

| Mode            | Evidence storage           | Complaint storage                          | Editable | Identity visible |
|-----------------|----------------------------|--------------------------------------------|----------|------------------|
| **Anonymous**   | IPFS/Pinata → CID on-chain | Sawtak blockchain, public pseudonym        | No       | No               |
| **Identified**  | Cloudflare R2 (private)    | PostgreSQL (AES-256-GCM encrypted)         | Yes      | Admin only       |

### Proof of Authority (POA) Blockchain

Sawtak runs a custom Cosmos SDK chain with **Proof of Authority (POA)** consensus instead of the default Proof of Stake:

- **Pre-approved validators**: Only vetted authorities (government bodies, oversight committees) can validate — no public staking or token voting
- **No inflation/token rewards**: Removes the need for a native token economy; validators are designated by governance
- **Censorship-resistant with accountability**: Complaints are immutable once committed, but only trusted entities operate the infrastructure
- **Custom POA module**: The standard Cosmos SDK `staking` and `minting` modules are disabled; a custom `poa` validation module enforces the authority set
- **3-node testnet**: The dev environment runs 3 validator nodes with internal governance; each node runs a full Cosmos SDK stack (REST :1317–1319, RPC :26657–26659, gRPC :9090–9092)

Anonymous complaints are stored on-chain with cryptographic proofs of submission, ensuring tamper-evident record-keeping verified by all validators.

## Tech Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Frontend    | Next.js 16, TypeScript, React Query, Zustand       |
| Backend     | Bun, Elysia.js, TypeScript                         |
| Database    | PostgreSQL 15, Prisma ORM                          |
| Cache/Queue | Redis, Bull                                        |
| Blockchain  | Cosmos SDK (custom chain), CosmJS                  |
| Storage     | Cloudflare R2 (identified evidence), IPFS/Pinata (anonymous evidence) |
| Monitoring  | Prometheus, Grafana                                |
| Proxy       | Elysia.js privacy proxy (separate service)         |

## Quick Start

### Prerequisites
- Podman **or** Docker with Compose plugin
- Bun (for local dev)

### Setup

Start by copying the env template — this is your **only** configuration file. All secrets, endpoints, and feature flags go here:

```bash
cp .env.example .env
# Now edit .env with your actual values (API keys, secrets, database URLs, etc.)
```

The `.env` file must contain all variables shown in [Required Env Vars](#required-env-vars-examples) below. Each service reads its own subset at runtime.

### Using Compose (Recommended)

**Podman:**
```bash
podman compose -f docker/docker-compose.prod-testnet.local.yml --env-file .env up -d
```

**Docker:**
```bash
docker compose -f docker/docker-compose.prod-testnet.local.yml --env-file .env up -d
```

```bash
# Check health
curl http://localhost:4000/health
```

This starts: Sawtak nodes (x3), PostgreSQL, Redis, Backend, Privacy Proxy, Frontend, Haweya OAuth.

### Manual Setup

**Backend:**
```bash
cd backend
cp .env.example .env  # edit with your values
bun install
bunx prisma generate
bunx prisma db push
bun run src/server.ts
```

**Privacy Proxy:**
```bash
cd privacy-proxy
cp .env.example .env
bun install
bun run src/server.ts
```

**Frontend:**
```bash
cd Front-end
bun install
NEXT_PUBLIC_API_URL=http://localhost:4000 bun run build
bun run start
```

### Required Env Vars (Examples)

```bash
# Backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sawtak?schema=public
JWT_SECRET=your-secret
PROXY_SECRET=your-proxy-secret
ENCRYPTION_KEY=<32-byte-hex>
COSMOS_CHAIN_ID=sawtak-testnet-1
COSMOS_BACKEND_MNEMONIC="your wallet mnemonic"
GEMINI_API_KEY=your-gemini-key
GOOGLE_CLIENT_ID=your-google-client-id

# Proxy
PROXY_PORT=4000
BACKEND_INTERNAL_URL=http://localhost:8000
PROXY_SECRET=your-proxy-secret
REDIS_HOST=localhost

# Frontend (build-time)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Building Your Own Images

Since frontend vars are embedded at build time, build with your values:

```bash
# Frontend
docker build -t sawtak-frontend Front-end \
  --build-arg NEXT_PUBLIC_API_URL=https://your-domain.com \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-id

# Backend
docker build -t sawtak-backend -f backend/Dockerfile .

# Proxy
docker build -t sawtak-proxy privacy-proxy

# Full stack (Podman)
podman compose -f docker/docker-compose.prod-testnet.local.yml --env-file .env build

# Full stack (Docker)
docker compose -f docker/docker-compose.prod-testnet.local.yml --env-file .env build
```

## API Endpoints

| Endpoint                              | Auth  | Description                        |
|---------------------------------------|-------|------------------------------------|
| `GET  /api/health`                    | —     | Health check                       |
| `GET  /api/feed`                      | —     | Public complaint feed              |
| `GET  /api/feed/stats`                | —     | Platform statistics                |
| `POST /api/auth/login`                | —     | Email/password login               |
| `POST /api/auth/register`             | —     | Register                           |
| `POST /api/complaints/anonymous/submit` | JWT | Submit anonymous complaint         |
| `POST /api/complaints/identified/submit`| JWT | Submit identified complaint        |
| `GET  /api/tracking/:code`            | —     | Track complaint status             |
| `POST /api/upload/ipfs`               | JWT   | Upload evidence to IPFS (anon only)|
| `POST /api/vote/:hash/:dir`           | JWT   | Upvote / downvote                  |
| `GET  /api/admin/complaints`          | Admin | Admin panel                        |
| `GET  /api/indexer/status`            | —     | Cosmos indexer status              |
| `GET  /swagger`                       | —     | Interactive API docs (Swagger UI)  |
| `GET  /proxy-metrics`                 | —     | Proxy Prometheus metrics           |
| `GET  /health`                        | —     | Proxy health check                 |

## Testing

```bash
# Route-layer tests (184 tests, zero network)
bun test

# Integration tests (24 tests, needs running stack)
bun run test:integration
```

Tests are classified:
- **Unit/Route-layer**: Mocked dependencies, inline Elysia handlers, no network
- **Integration**: Live proxy+backend pipeline against postgres+redis

## Project Structure

```
sawtak/
├── backend/           # Elysia.js API server (internal)
├── privacy-proxy/     # Privacy proxy (public-facing)
├── Front-end/         # Next.js frontend
├── haweya/            # Mock Haweya OAuth provider
├── network/Sawtak/    # Custom Cosmos POA blockchain
│   └── tests/         # Chain-level consensus tests
├── docker/            # Docker compose definitions
├── monitoring/        # Prometheus, Grafana, Alertmanager
└── .github/workflows/ # CI/CD pipeline
```

## Monitoring

Sawtak ships with a **Prometheus + Grafana** stack for observability across all services.

### Stack Components

| Component               | Purpose                                                  | Port  |
|-------------------------|----------------------------------------------------------|-------|
| **Prometheus**          | Metrics collection & alert evaluation                    | 19100 |
| **Grafana**             | Dashboards & visualization                               | 3100  |
| **Redis Exporter**      | Redis metrics (memory, clients, commands)                | 9121  |
| **PostgreSQL Exporter** | Database metrics (connections, queries, deadlocks)       | 9187  |
| **Alertmanager**        | Alert routing & notifications (email, webhook)           | —     |

### Metrics Collected

| Job               | Source                                              | Endpoint          |
|-------------------|-----------------------------------------------------|-------------------|
| `sawtak-backend`  | Request rate, latency, errors                       | `/api/metrics`    |
| `sawtak-proxy`    | Requests, stripped headers, rate limits             | `/proxy-metrics`  |
| `redis`           | Connected clients, memory, rejected connections     | Redis Exporter :9121 |
| `postgres`        | Active connections, slow queries, deadlocks         | Postgres Exporter :9187 |

### Alerting Rules

| Alert                      | Severity | Condition                              |
|----------------------------|----------|----------------------------------------|
| `BackendDown`              | Critical | Backend unreachable > 1m               |
| `HighErrorRate`            | Critical | 5xx rate > 5% over 5m                  |
| `HighLatency`              | Warning  | p95 latency > 1s over 5m              |
| `RedisDown`                | Critical | Redis unreachable > 1m                 |
| `RedisHighMemoryUsage`     | Warning  | Memory > 80% over 5m                  |
| `PostgresDown`             | Critical | PostgreSQL unreachable > 1m            |
| `PostgresHighConnections`  | Warning  | Connection usage > 80% over 5m        |
| `RateLimitViolationsHigh`  | Warning  | > 100 violations in 1h                |

### Running

```bash
# Podman
podman compose -f monitoring/docker-compose.monitoring.yml --env-file .env up -d

# Docker
docker compose -f monitoring/docker-compose.monitoring.yml --env-file .env up -d
```

Requires the `sawtak_internal` and `sawtak_privacy` networks (created automatically by the main compose stack).

### Dashboards

- **Grafana**: http://localhost:3100 (default: `admin` / `admin`)
- **Prometheus**: http://localhost:19100

Pre-provisioned dashboards:
- **Sawtak Overview** — Request rate, latency, error rate, rate limit violations
- **Redis Overview** — Memory, connected clients, command rate
- **PostgreSQL** — Connection count, query performance, deadlocks

## Security

- Passwords hashed with bcrypt (cost 12)
- JWT access + refresh tokens
- AES-256-GCM encryption for PII
- Identity reveal requires 2-step approval (Team Admin → Platform Admin)
- Audit logging for all admin actions
- Rate limiting per session + per IP
- Proxy auth — backend only accepts requests from the proxy
