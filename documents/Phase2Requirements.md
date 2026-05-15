# Sawtak — Phase 2 Product Requirements Document

> **Scope:** This document defines all functional and non-functional requirements for Phase 2 of the Sawtak platform. Phase 1 (v3-Req) established the core complaint submission system on Hedera HCS. Phase 2 delivers: (1) full migration to a custom Cosmos SDK PoA chain, (2) a basic Capacitor-wrapped Next.js mobile app with custom splash/home screens, (3) a simple video evidence player, (4) IPFS-first evidence strategy via Pinata, (5) the existing 184-test suite, (6) complete blockchain network (testnet) & full-stack Compose orchestration, and (7) updated frontend documentation with architecture diagrams.

---

## 1. SYSTEM OVERVIEW

### 1.1 What Changes in Phase 2

| Area | Phase 1 (v3) | Phase 2 (v4) |
|---|---|---|
| Blockchain | Hedera HCS (managed public ledger) | Custom Cosmos SDK PoA AppChain |
| Consensus | Hedera managed PoS | Proof of Authority — vetted validators only |
| Blockchain SDK | `@hashgraph/sdk` / `@hiero-ledger/sdk` | `@cosmjs/stargate`, `@cosmjs/proto-signing` |
| On-chain module | HCS Topics 1 & 2 | Custom `sawtak` module (`MsgCreateAnonymousComplaint`, `MsgUpdateComplaintStatus`, etc.) |
| Indexer | `HederaIndexerService` polling HCS Mirror Node | `CosmosIndexerService` subscribing via Tendermint WebSocket |
| DB hash column | `hcs_hash` | `cosmos_hash` (migrated) |
| IPFS | Web3.Storage (deprecated free tier) | Pinata (JWT-authenticated, production-ready) |
| Mobile | Web only | Capacitor wrapping the existing Next.js app (custom mobile home & splash screen) |
| Evidence playback | Images only inline | Simple video player + direct file access for PDFs |
| Frontend docs | Inline README | Separate `docs/` with architecture diagrams |
| Test suite | Route-layer + light integration (184 tests) | Route-layer + integration + chain-level (maintained at 184 tests) |
| Compose stack | Partial (no blockchain nodes) | Full stack: 3 Cosmos nodes + Postgres + Redis + Backend + Proxy + Frontend + Haweya + Monitoring |

### 1.2 Core Architecture (Phase 2)

The network trust-zone model from Phase 1 is preserved and extended with the custom Cosmos chain layer, and notably includes the **Privacy Proxy Layer** established in Phase 2 to ensure absolute anonymity before requests hit the backend:

```text
                               PUBLIC INTERNET
┌────────────────────────────────────────────────────────────────────────────┐
│  Browser (Web)  │  Mobile (Capacitor/iOS/Android)  │  Admin  │  Haweya     │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  DMZ — PRIVACY PROXY  :4000                                                │
│  Anonymous session mgmt · Header stripping · Rate limiting (Redis)         │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │  internal network (proxy-auth required)
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  BACKEND  :8000  (Bun / Elysia.js)                                         │
│  Auth · Submission services · AI validation · Cosmos + Pinata clients      │
│  CosmosIndexerService (Tendermint WebSocket → Postgres)                    │
└───────────┬────────────────────────────────────┬───────────────────────────┘
            │  gRPC / REST                       │  HTTPS
            ▼                                    ▼
┌──────────────────────────┐       ┌─────────────────────────────────────────┐
│  Sawtak PoA Testnet      │       │  External Integrations                  │
│  Node-1 :26657 :9090     │       │  Pinata IPFS (anon evidence)            │
│  Node-2 :26658 :9091     │       │  Cloudflare R2 (identified evidence)    │
│  Node-3 :26659 :9092     │       │  Gemini AI (spam filter)                │
│  Consensus: PoA          │       │  Haweya OAuth (national ID)             │
│  Google OAuth                            │
└──────────────────────────┘       └─────────────────────────────────────────┘
```

### 1.3 Technology Stack (Phase 2 Full)

```text
Frontend:
├── Web:    Next.js 16, TypeScript, React Query (TanStack), Zustand
├── Mobile: Capacitor 6 wrapping the Next.js app (custom home/splash)
└── Style:  TailwindCSS, shadcn/ui

Backend:
├── Runtime:   Bun
├── Framework: Elysia.js
├── Language:  TypeScript
└── Jobs:      Bull Queue (Redis-backed)

Database:
├── Primary: PostgreSQL 16
├── Cache:   Redis 7 (sessions, rate limiting, job queue)
└── Search:  PostgreSQL Full-Text Search (tsvector)

Blockchain:
├── Network:   Sawtak custom AppChain (Cosmos SDK)
├── Consensus: Proof of Authority (custom `poa` module)
├── Client:    @cosmjs/stargate, @cosmjs/proto-signing
└── Indexer:   Tendermint WebSocket (CosmosIndexerService)

File Storage:
├── Anonymous evidence:   IPFS via Pinata (JWT-authenticated)
└── Identified evidence:  Cloudflare R2 (private, no chain)

Authentication:
├── JWT (access 1h + refresh 7d, Redis-backed)
├── Google OAuth 2.0
├── Haweya OAuth (national ID provider)
└── bcrypt (cost: 12)

Infrastructure:
├── Proxy:     Elysia.js privacy proxy (separate service)
├── Monitoring: Prometheus + Grafana + Alertmanager
└── Compose:   Podman / Docker Compose (full stack + testnet)
```

### 1.4 Updated Repository Structure

```text
sawtak/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── complaint.routes.ts          # anonymous + identified
│   │   │   ├── admin.routes.ts
│   │   │   ├── feed.routes.ts
│   │   │   ├── upload-evidence.routes.ts    # Pinata IPFS uploads
│   │   │   ├── vote.routes.ts
│   │   │   ├── tracking.routes.ts
│   │   │   └── indexer.routes.ts            # /api/indexer/status|start|reindex
│   │   ├── services/
│   │   │   ├── cosmos/
│   │   │   │   ├── sawtak-cosmos.service.ts # active blockchain service
│   │   │   │   └── cosmos-indexer.service.ts
│   │   │   ├── ipfs/
│   │   │   │   └── pinata.service.ts
│   │   │   ├── anonymous-submission.service.ts
│   │   │   ├── identified-submission.service.ts
│   │   │   ├── complaint-status.service.ts
│   │   │   └── ai-validation.service.ts
│   │   ├── middleware/
│   │   │   ├── proxy-auth.middleware.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── config/
│   │   │   └── cosmos.config.ts             # COSMOS_* env validation
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma                    # cosmos_hash, updated schema
│   └── tests/
│       ├── Anonymous-submission.test.ts
│       ├── cosmos-indexer.test.ts
│       ├── upload-evidence.test.ts
│       ├── admin.routes.test.ts
│       └── integration/
│           └── proxy-pipeline.test.ts
│
├── privacy-proxy/
│   ├── src/
│   │   ├── policies/
│   │   ├── middleware/
│   │   └── services/
│   └── tests/
│
├── Front-end/
│   ├── app/                                 # Next.js app router
│   ├── components/
│   │   ├── evidence/
│   │   │   ├── VideoPlayer.tsx              # NEW — simple video playback
│   │   │   └── ImageGallery.tsx             # Inline images
│   │   └── ui/
│   ├── docs/                                # NEW — docs site source
│   │   ├── architecture/
│   │   │   ├── overview.mdx
│   │   │   ├── trust-zones.mdx
│   │   │   └── blockchain.mdx
│   └── capacitor.config.ts                  # NEW — Capacitor config
│
├── network/
│   └── Sawtak/                              # Custom Cosmos SDK chain
│       ├── Dockerfile
│       ├── entrypoint.sh
│       └── tests/                           # chain-level consensus tests
│
├── docker/
│   ├── docker-compose.prod-testnet.local.yml   # Full stack + 3 Cosmos nodes
│   └── docker-compose.monitoring.yml
│
├── monitoring/
│   ├── prometheus.yml
│   ├── grafana/
│   └── alertmanager.yml
```

---

## 2. BLOCKCHAIN MIGRATION — HEDERA → COSMOS SDK

*Epic: Backend Migration — Cosmos SDK Integration (SAW-148)*

### 2.1 SawtakCosmosService — Blockchain Service Replacement

**User Story:** As a backend developer, I want to replace `HederaService` with `SawtakCosmosService` so that complaint submissions work with the Cosmos SDK blockchain.

#### Functional Requirements

- Implement `SawtakCosmosService` that satisfies the existing `IBlockchainService` interface — no callers need to know the underlying chain changed.
- Expose a `submitMessage(payload: CosmosPayload): Promise<CosmosReceipt>` method that:
  1. Signs the transaction using `SigningStargateClient` from `@cosmjs/stargate` with the backend mnemonic.
  2. Broadcasts via `signAndBroadcast()` targeting the Cosmos RPC endpoint.
  3. Returns a receipt containing: `txHash`, `height`, `gasUsed`.
- Map all message payloads to their Cosmos SDK `Msg` types:
  - `MsgCreateAnonymousComplaint`
  - `MsgCreateIdentifiedComplaint`
  - `MsgUpdateComplaintStatus`
- `AnonymousSubmissionService` constructor must default to `SawtakCosmosService`.
- `ComplaintStatusService` must use `SawtakCosmosService` for all on-chain status updates.

#### Implementation Subtasks (from Jira SAW-149)
- Create `SawtakCosmosService` implementing `IBlockchainService` interface.
- Implement `submitMessage()` using `SigningStargateClient.signAndBroadcast()`.
- Map message payloads to Cosmos SDK `Msg` types (`MsgCreateAnonymousComplaint`, etc.).
- Add `@cosmjs/stargate` and `@cosmjs/proto-signing` to `package.json`.
- Add and validate all `COSMOS_*` environment variables (see §9.2).

---

### 2.2 CosmosIndexerService — Indexer Service Migration

**User Story:** As an indexer operator, I want to replace `HederaIndexerService` with `CosmosIndexerService` so that complaint data is indexed from the Cosmos blockchain.

#### Functional Requirements

- Implement `CosmosIndexerService` using `Tendermint34Client` for WebSocket block subscription.
- Implement `processBlock(height: number)`:
  - Fetch all transactions in the block via RPC `tx_search`.
  - Decode transaction events.
  - Filter by `message.action` to determine event type.
  - Route to the correct handler.
- Implement the following event handlers:
  - `indexAnonymousComplaint()` — writes to `indexedComplaint` with `chain_type: 'cosmos'`.
  - `indexIdentifiedComplaint()` — writes identified complaint metadata.
  - `indexStatusUpdate()` — writes to `indexedStatusUpdate` using `cosmos_tx_hash` and sequence.
- Expose indexer management endpoints:
  - `GET  /api/indexer/status` — returns `{ isRunning, lastHeight, rpcEndpoint }`.
  - `POST /api/indexer/start` — starts the indexer if stopped.
  - `POST /api/indexer/reindex` — triggers a full reindex from genesis or a given height.
- Configurable via environment:
  - `INDEXER_START_HEIGHT` — block height to begin indexing from (default: `0`).
  - `INDEXER_POLL_INTERVAL` — polling interval in ms (default: `10000`).
- Feature flag: `ENABLE_COSMOS_INDEXER=true` / `ENABLE_HEDERA_INDEXER=false` (both in `.env`).
- Singleton pattern: `getIndexer()` always returns the same service instance.

#### Implementation Subtasks (from Jira SAW-150)
- Create `CosmosIndexerService` using `Tendermint34Client` for WebSocket subscription.
- Implement `processBlock()` to decode tx events and filter by `message.action`.
- Implement `indexAnonymousComplaint()`, `indexIdentifiedComplaint()`, `indexStatusUpdate()` handlers.
- Add indexer management endpoints (`/api/indexer/status`, `start`, `reindex`).

---

### 2.3 Prisma Schema Update

**User Story:** As a database admin, I want to update the Prisma schema so that `indexedComplaint` supports `cosmos_hash` fields.

#### Functional Requirements

- Add `cosmos_hash` field to `indexedComplaint` as the primary blockchain identifier.
- Add `chain_type` field (`'hedera' | 'cosmos'`) to `indexedComplaint` for dual-chain support.
- Update `indexedStatusUpdate` model to use:
  - `cosmos_tx_hash` — the Cosmos transaction hash for the status update.
  - `sequence` — the message sequence number within the block.
- All new fields must have database indexes.
- Full-text search index on `complaint_text` must be preserved.

#### Implementation Subtasks (from Jira SAW-151)
- Add `cosmos_hash` field (primary key).
- Add `chain_type` field (`'hedera' | 'cosmos'`).
- Update `indexedStatusUpdate` to use `cosmos_tx_hash` + sequence.

---

### 2.4 Service Injection Refactor

**User Story:** As a backend developer, I want to update dependency injection so that Cosmos services replace Hedera services.

#### Functional Requirements

- Update all DI container registrations so `SawtakCosmosService` is injected dynamically based on environment configuration.
- Update all DI container registrations so `CosmosIndexerService` is used actively.

#### Implementation Subtasks (from Jira SAW-152)
- Update `AnonymousSubmissionService` constructor.
- Update `ComplaintStatusService` to use Cosmos blockchain service.

---

### 2.5 Route Documentation Update

**User Story:** As an API consumer, I want updated endpoint documentation so I understand Cosmos-based responses.

#### Functional Requirements

- Update all route descriptions to remove `"Hedera blockchain"` references.
- Update `POST /api/complaints/anonymous/submit` response schema: add `cosmos_tx_hash` field.
- All Swagger/OpenAPI docs regenerated and consistent with Cosmos response shapes.
- `GET /swagger` must return correct Cosmos-native field names.

#### Implementation Subtasks (from Jira SAW-153)
- Update `POST /api/complaints/anonymous/submit` response schema.
- Update route descriptions.

---

### 2.6 Hedera Code Disablement & Data Migration

**User Story:** As a DevOps engineer, I want to disable Hedera dependencies and migrate active data to prioritize Cosmos.

#### Functional Requirements

**Code Disablement (Not Removal):**
- Hedera code (`@hiero-ledger/sdk`, `hedera.service.ts`, `hedera-indexer.service.ts`) is **NOT** to be removed from the repository.
- Use feature flags (`ENABLE_HEDERA_INDEXER=false`, `ENABLE_HEDERA_SERVICE=false`) to ensure Hedera pathways do not execute in the Phase 2 production environment.

**Data Migration (Postgres):**
- Migrate all existing `hcs_hash` values to the `cosmos_hash` column in `indexedComplaint`.
- Retain the `hcs_hash` column and `chain_type` column for backwards compatibility during this phase.

#### Implementation Subtasks (from Jira SAW-155)
- Ensure feature flags disable Hedera services in `backend/server.ts` and dependency injection.
- Migrate `hcs_hash` → `cosmos_hash` in `indexedComplaint` table.

---

## 3. IPFS — PINATA INTEGRATION

Phase 1 used Web3.Storage (free tier, now deprecated). Phase 2 upgrades to Pinata for production-grade IPFS pinning.

### 3.1 Functional Requirements

- All anonymous complaint evidence must be uploaded to IPFS via Pinata before the on-chain transaction is submitted.
- The returned IPFS CID must be embedded in the `MsgCreateAnonymousComplaint` payload so evidence is tamper-evidently linked on-chain.
- Upload flow:
  1. User attaches files in the submission form.
  2. Frontend validates files client-side (type, size, count).
  3. On submit, `POST /api/upload/ipfs` is called (auth required, routed through privacy proxy).
  4. Backend validates files server-side (magic bytes, EXIF strip for images).
  5. Backend calls Pinata API with `PINATA_JWT` for authentication.
  6. Returns `{ cid, gatewayUrl }` per file.
  7. CIDs are included in the complaint payload that goes on-chain.
- Evidence CIDs stored in `indexedComplaint.evidence_cids` (JSONB array) after indexing.
- Retrieval: generate gateway URLs using Pinata public gateway (`https://gateway.pinata.cloud/ipfs/{cid}`), with fallback to `ipfs.io` and `nftstorage.link`.
- Identified complaint evidence is **never** uploaded to IPFS — Cloudflare R2 only (no change from Phase 1).

### 3.2 File Validation (Both Storage Paths)

- Validate file type using magic bytes, not extension.
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`, `application/pdf`.
- Rejected: all executables and scripts (`.exe`, `.sh`, `.bat`, `.js`, `.app`, etc.).
- Size limits: max 50 MB per file, max 200 MB per complaint, max 10 files.
- Image processing: strip EXIF metadata (privacy protection) before upload.
- Return structured error messages per file on rejection.

### 3.3 Environment Variables

```bash
PINATA_JWT=<your-pinata-jwt>
PINATA_API_KEY=<optional-legacy>
PINATA_SECRET_API_KEY=<optional-legacy>
```

---

## 4. MOBILE APP — CAPACITOR + NEXT.JS

Phase 2 ships a basic Capacitor-wrapped version of the existing Next.js web app. The focus is on establishing the mobile shell and custom UI entry points, without complex native integrations yet.

### 4.1 Setup & Build

- Install and configure Capacitor 6 in the `Front-end/` directory.
- Generate native project shells: `ios/` (Xcode) and `android/` (Gradle) inside `Front-end/`.
- `capacitor.config.ts` must specify:
  - `appId`: `com.sawtak.app`
  - `appName`: `Sawtak`
  - `webDir`: `out` (Next.js static export)
  - `server.androidScheme`: `https`
- Next.js build must be configured for static export (`output: 'export'`) for Capacitor compatibility. Server-side routes that cannot be static must be rewritten to API calls against the privacy proxy.
- Capacitor sync command: `bunx cap sync` — must be run after every `bun run build`.

### 4.2 Custom Mobile UI

- **Mobile Home Screen:** Implement a mobile-specific layout for the root view when accessed via the Capacitor app, providing optimized touch targets and simplified navigation.
- **Splash Screen:** Configure a custom Sawtak branded splash screen for both Android and iOS that displays during app initialization.

*(Note: Native API access like camera, push notifications, offline storage, deep linking, and App Store distribution are specifically excluded from this phase).*

---

## 5. FRONTEND UPDATES

### 5.1 Evidence Display

#### Simple Video Player
- Implement a `VideoPlayer` React component in `components/evidence/VideoPlayer.tsx`.
- Triggered wherever a complaint's evidence CIDs resolve to `video/mp4` or `video/webm` MIME types.
- Provides simple HTML5 `<video>` controls (Play, Pause, Scrub, Volume).
- Video is streamed directly from the IPFS gateway URL for anonymous evidence or a signed R2 URL for identified evidence.

#### PDF Files
- No inline PDF viewer is required.
- Show a simple "Access PDF" / "Download PDF" button that links out to the gateway URL.

#### Image Gallery
- Existing image inline display is retained. Images are shown within the standard feed flow.

### 5.2 Frontend Documentation

A dedicated documentation site (rendered from `Front-end/docs/`) must ship alongside the app.

#### Architecture Diagrams (Required)

The following Mermaid or SVG diagrams must be included:

1. **System Overview** — full trust-zone diagram (matches the ASCII diagram in the README but rendered as SVG).
2. **Request Flow** — detailed sequence diagram: `User → Proxy → Backend → Cosmos → Indexer → Postgres`.
3. **Anonymous Submission Flow** — sequence: form submission → IPFS upload → Cosmos transaction → indexer → confirmation.
4. **Identified Submission Flow** — sequence: form submission → R2 upload → Postgres → confirmation.
5. **Blockchain Architecture** — 3-node PoA validator diagram with port mapping.
6. **Privacy Proxy Internals** — component diagram of the proxy pipeline (session, sanitizer, forwarder, rate limiter).

---

## 6. FULL TEST SUITE

Phase 2 maintains the existing 184-test suite to cover core services, proxy validations, and Cosmos integrations.

### 6.1 Test Tier Architecture

| Tier | Target | Network | Run Command |
|---|---|---|---|
| Route-layer | `Elysia().handle()` in-process | None | `bun test` |
| Service-unit | Real service classes, mocked clients | None | `bun test --filter unit` |
| Integration | Live proxy + backend + DB | Localhost containers | `bun run test:integration` |
| Chain-level | Live Cosmos nodes, multi-node sync | Testnet compose | `bun run test:chain` |

A root `bunfig.toml` excludes `**/integration/**` and `**/chain/**` from default `bun test` discovery.

### 6.2 Existing Tests Maintained (184 Tests)

- **Cosmos Service Tests:** Coverage for `SawtakCosmosService` instantiation, `submitMessage()`, payload validation, and `CosmosIndexerService` WebSocket handlers.
- **Integration Tests:** Proxy pipeline tests (`proxy-pipeline.test.ts`) covering anonymous complaint submission from proxy to indexer, and multi-node Cosmos replication.
- **Privacy Proxy Tests:** Rate limiter logic and header stripping validation.

### 6.3 CI Requirements

- `bun test` (route-layer) must pass on every pull request.
- `bun run test:integration` must pass on merge to `main` (requires Compose stack healthy).
- `bun run test:chain` runs on a nightly schedule against the testnet Compose stack.
- Test results must be reported as GitHub Actions check statuses.

---

## 7. TESTNET DOCKERIZATION & FULL STACK COMPOSE

### 7.1 Full Stack Compose (`docker-compose.prod-testnet.local.yml`)

The compose file orchestrates the complete Sawtak stack for local testnet development and staging validation. All services are defined and working (see `docker/docker-compose.prod-testnet.local.yml`).

#### Services

| Service | Image | Ports | Purpose |
|---|---|---|---|
| `sawtak-node-1` | `sawtak-node:latest` | `26657`, `1317`, `9090` | Genesis validator (Cosmos PoA) |
| `sawtak-node-2` | `sawtak-node:latest` | `26658`, `1318`, `9091` | Validator node 2 |
| `sawtak-node-3` | `sawtak-node:latest` | `26659`, `1319`, `9092` | Validator node 3 |
| `postgres` | `postgres:16-alpine` | internal | Primary database |
| `redis` | `redis:7-alpine` | internal | Cache, rate limiting, job queue |
| `backend` | `sawtak-backend:latest` | internal `:8000` | API server (proxy-auth required) |
| `privacy-proxy` | `sawtak-privacy-proxy:latest` | `4000` | Public entrypoint |
| `frontend` | `sawtak-frontend:latest` | `3000` | Next.js web app |
| `haweya-db` | `postgres:15-alpine` | internal | Haweya OAuth DB |
| `haweya-app` | `sawtak-haweya-app:latest` | `3030` | Mock national ID OAuth provider |

#### Network Topology

```
Network: sawtak_internal  — backend, postgres, redis, cosmos nodes, haweya-db, haweya-app
Network: sawtak_proxy     — privacy-proxy, frontend, haweya-app
Network: sawtak_privacy   — backend, privacy-proxy, redis
```

- `backend` has no externally exposed ports — accessible only from `sawtak_privacy` network via proxy.
- Cosmos nodes are on `sawtak_internal` — accessible only by the backend.
- `redis` spans `sawtak_internal` and `sawtak_privacy` — shared between backend and proxy.

#### Startup Order & Health Checks

```
postgres (healthy) ──┐
redis (healthy)    ──┼──→ backend (started) ──→ privacy-proxy (started) ──→ frontend
sawtak-node-1      ──┘
sawtak-node-2 depends_on: sawtak-node-1
sawtak-node-3 depends_on: sawtak-node-1
haweya-db (healthy) → haweya-app
```

- `backend` runs Prisma migrations (`bunx prisma migrate deploy`) before starting the server.
- Health checks defined for: `postgres`, `redis`, `haweya-db`.

#### Environment Variables (Required for Compose)

```bash
# Blockchain
COSMOS_CHAIN_ID=sawtak-testnet-1
COSMOS_BACKEND_MNEMONIC="your wallet mnemonic here"
COSMOS_ADDRESS_PREFIX=sawtak
SAWTAK_BACKEND_PUBKEY=<hex-pubkey>
INDEXER_START_HEIGHT=0
INDEXER_POLL_INTERVAL=10000

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=sawtak

# Cache
REDIS_PASSWORD=          # leave empty for testnet

# Security
JWT_SECRET=<random-32-bytes>
PROXY_SECRET=<random-32-bytes>
ENCRYPTION_KEY=<32-byte-hex>
PLATFORM_SECRET=<random>
BACKEND_PRIVATE_KEY_PEM=<pem-encoded-key>

# Storage
PINATA_JWT=<your-pinata-jwt>
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=sawtak-public-evidence
R2_PUBLIC_URL=

# AI
GEMINI_API_KEY=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
HAWEYA_CLIENT_ID=sawtak_client
HAWEYA_CLIENT_SECRET=sawtak_secret
NEXT_PUBLIC_HAWEYA_CLIENT_ID=sawtak_client

# Frontend
FRONTEND_URL=http://localhost
NEXT_PUBLIC_API_URL=http://localhost:4000
INTERNAL_API_URL=http://privacy-proxy:4000

# Indexer feature flags
ENABLE_COSMOS_INDEXER=true
ENABLE_HEDERA_INDEXER=false
```

#### Usage Commands

```bash
# Start full stack (Podman)
podman compose -f docker/docker-compose.prod-testnet.local.yml --env-file .env up -d

# Start full stack (Docker)
docker compose -f docker/docker-compose.prod-testnet.local.yml --env-file .env up -d

# Check health
curl http://localhost:4000/health
curl http://localhost:4000/api/indexer/status

# View logs
podman compose -f docker/docker-compose.prod-testnet.local.yml logs -f backend
podman compose -f docker/docker-compose.prod-testnet.local.yml logs -f sawtak-node-1

# Rebuild and restart a single service
podman compose -f docker/docker-compose.prod-testnet.local.yml up -d --build backend

# Tear down (preserves volumes)
podman compose -f docker/docker-compose.prod-testnet.local.yml down

# Tear down and wipe all data (full reset)
podman compose -f docker/docker-compose.prod-testnet.local.yml down -v
```

### 7.2 Monitoring Compose (`docker-compose.monitoring.yml`)

Separate compose file for the observability stack. Requires the main stack's networks to exist.

| Service | Port | Purpose |
|---|---|---|
| Prometheus | `19100` | Metrics collection, alert evaluation |
| Grafana | `3100` | Dashboards and visualisation |
| Redis Exporter | `9121` | Redis metrics |
| PostgreSQL Exporter | `9187` | DB metrics |
| Alertmanager | — | Alert routing (email, webhook) |

Pre-provisioned dashboards:
- **Sawtak Overview**: request rate, latency, error rate, rate limit violations.
- **Redis Overview**: memory, connected clients, command rate.
- **PostgreSQL**: connection count, query performance, deadlocks.
- **Cosmos Chain**: block height, block time, validator status, indexer lag.

#### Alerting Rules

| Alert | Severity | Condition |
|---|---|---|
| `BackendDown` | Critical | Backend unreachable > 1m |
| `HighErrorRate` | Critical | 5xx rate > 5% over 5m |
| `HighLatency` | Warning | p95 latency > 1s over 5m |
| `RedisDown` | Critical | Redis unreachable > 1m |
| `PostgresDown` | Critical | PostgreSQL unreachable > 1m |
| `CosmosNodeDown` | Critical | Any validator node unreachable > 2m |
| `IndexerLag` | Warning | Indexer last height > 100 blocks behind chain tip |
| `RateLimitViolationsHigh` | Warning | > 100 violations in 1h |

```bash
# Start monitoring (requires main stack running first)
podman compose -f monitoring/docker-compose.monitoring.yml --env-file .env up -d
```

### 7.3 Cosmos Network (`network/Sawtak/`)

The custom Cosmos SDK chain runs from a multi-stage Dockerfile:

- **Node 1 (Genesis)**: bootstraps the chain, creates the genesis block with the PoA validator set. Exposes RPC `:26657`, REST `:1317`, gRPC `:9090`.
- **Node 2 & 3 (Validators)**: join via `PERSISTENT_PEERS` pointing to Node 1's P2P address. Each exposes ports offset by +1 and +2 respectively.
- `SAWTAK_BACKEND_PUBKEY` is injected at genesis so the backend wallet can submit transactions immediately without a separate delegation step.
- `entrypoint.sh` is mounted read-only into each node container and handles:
  - First-time genesis initialisation.
  - Key import from environment variables.
  - Node startup and peer configuration.
- All node data is persisted to named volumes (`sawtak_node_1_data`, etc.) and survives container restarts.

---

## 8. API ENDPOINTS (PHASE 2 FULL)

```
Authentication:
POST   /api/auth/login                         # email/password or OAuth token
POST   /api/auth/register                      # email/password registration
POST   /api/auth/logout
GET    /api/auth/verify                        # JWT verification
POST   /api/auth/google/callback               # Google OAuth callback
POST   /api/auth/haweya/callback               # Haweya OAuth callback
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email?token={token}
PUT    /api/auth/profile
PUT    /api/auth/change-password

Complaints:
POST   /api/complaints/anonymous/submit        # → Cosmos chain
POST   /api/complaints/identified/submit       # → Postgres
POST   /api/complaints/validate                # AI spam/content check
GET    /api/complaints/my-anonymous
GET    /api/complaints/my-identified
GET    /api/complaints/anonymous/:hash
GET    /api/complaints/identified/:id
PUT    /api/complaints/identified/:id
DELETE /api/complaints/identified/:id

File Upload:
POST   /api/upload/ipfs                        # → Pinata (anon evidence only)

Feed (Public):
GET    /api/feed                               # filter: search, category, area, dateFrom/To, sort, page, limit
GET    /api/feed/:id
GET    /api/feed/stats

Tracking:
GET    /api/track/:code
GET    /api/track/:code/history

Voting:
POST   /api/vote                               # toggle vote
GET    /api/vote/:complaintId
GET    /api/vote/status?complaintId=xxx
POST   /api/vote/batch

Indexer:
GET    /api/indexer/status
POST   /api/indexer/start
POST   /api/indexer/reindex

Admin:
GET    /api/admin/complaints
GET    /api/admin/complaints/:id
PATCH  /api/admin/complaints/:id/status
POST   /api/admin/complaints/:id/escalate
GET    /api/admin/stats
GET    /api/admin/users
POST   /api/admin/complaints/:id/request-identity-reveal
GET    /api/admin/identity-reveal-requests
GET    /api/admin/teams
POST   /api/admin/teams
GET    /api/admin/teams/available-entities
GET    /api/admin/teams/my-teams
GET    /api/admin/teams/:id
POST   /api/admin/teams/:id/members
PATCH  /api/admin/teams/:id/members/:userId

System:
GET    /api/health
GET    /api/metrics                            # Prometheus metrics (backend)
GET    /proxy-metrics                          # Prometheus metrics (proxy)
GET    /swagger                                # Swagger UI (OpenAPI docs)
```

---

## 9. NON-FUNCTIONAL REQUIREMENTS

### 9.1 Performance

- Anonymous complaint submission (end-to-end, including Cosmos transaction): < 10 seconds at p95.
- Feed page load (first meaningful paint): < 2 seconds on 4G mobile.
- Video evidence player: first frame visible < 3 seconds on the IPFS gateway.
- Indexer lag: must stay within 50 blocks of chain tip under normal load.

### 9.2 Environment & Configuration

All required `COSMOS_*` variables must be validated at application startup. The backend must refuse to start and print a clear error if any required variable is absent or malformed:

| Variable | Required | Description |
|---|---|---|
| `COSMOS_CHAIN_ID` | Yes | Chain ID (e.g. `sawtak-testnet-1`) |
| `COSMOS_RPC_ENDPOINT` | Yes | Tendermint RPC (e.g. `http://sawtak-node-1:26657`) |
| `COSMOS_GRPC_ENDPOINT` | Yes | gRPC endpoint (e.g. `http://sawtak-node-1:9090`) |
| `COSMOS_REST_ENDPOINT` | Yes | REST API (e.g. `http://sawtak-node-1:1317`) |
| `COSMOS_BACKEND_MNEMONIC` | Yes | 24-word BIP-39 mnemonic for the signing wallet |
| `COSMOS_ADDRESS_PREFIX` | No | Address bech32 prefix (default: `sawtak`) |
| `INDEXER_START_HEIGHT` | No | Block height to start indexing from (default: `0`) |
| `INDEXER_POLL_INTERVAL` | No | Polling interval in ms (default: `10000`) |
| `ENABLE_COSMOS_INDEXER` | No | Feature flag (default: `true`) |
| `ENABLE_HEDERA_INDEXER` | No | Feature flag (default: `false`) |

All `HEDERA_*` variables must be removed from `.env.example` and all deployment configuration files.

### 9.3 Security

- No change to the privacy proxy trust model from Phase 1 — all existing header stripping and proxy-auth enforcement is preserved.
- IPFS evidence CIDs are public by nature — the `POST /api/upload/ipfs` route requires JWT authentication to prevent abuse.
- The `COSMOS_BACKEND_MNEMONIC` must never be logged or included in error messages.

### 9.4 Observability

- All existing Prometheus metrics from Phase 1 are preserved.
- New metrics added in Phase 2:
  - `cosmos_indexer_last_height` — gauge, current indexed block height.
  - `cosmos_indexer_lag_blocks` — gauge, difference between chain tip and indexer height.
  - `cosmos_tx_submit_duration_ms` — histogram, time from submission to confirmation.
  - `ipfs_upload_duration_ms` — histogram, Pinata upload latency.
  - `ipfs_upload_errors_total` — counter, Pinata upload failures by error type.
- Grafana dashboard `Cosmos Chain` must be added (block height, indexer lag, tx submission latency).

### 9.5 Codebase Cleanliness

- `eslint` and TypeScript `strict` mode must pass with zero errors on CI.
- No `console.log` statements in production code — use the structured logger.
- All new services must have JSDoc comments on public methods.

### 9.6 Backwards Compatibility

- The public feed API (`GET /api/feed`) must continue to return complaints indexed from the Hedera era (via the archived `hcs_hash` data) if they exist in the DB — they will have `cosmos_hash: null` and `chain_type: 'hedera'` during the transition.
- Once the `chain_type` column is dropped, all records must have valid `cosmos_hash` values or the record must be excluded from the feed.
- Clients (web + mobile) must handle a `cosmos_tx_hash` field being absent on old complaints without crashing.
