# Sawtak Test Suite Documentation

## Architecture

The suite uses **two tiers**:

| Tier | Target | Purpose | Run Command |
|------|--------|---------|-------------|
| **Route-Layer** | `Elysia().handle()` in-process | Validates schema, wiring, handler logic | `bun test` or `bun run test` |
| **Integration** | `http://localhost:4000` (live proxy->backend) | Real HTTP pipeline through privacy proxy to backend | `bun run test:integration` |

Route-layer tests use **no network** -- they invoke Elysia handlers directly via `app.handle(new Request(...))`. They embed inline handler stubs that mirror the real route logic (validation, status codes, response shapes) without touching DB, Cosmos, or Pinata. Integration tests hit real containers and skip gracefully if they're down.

A root `bunfig.toml` excludes `**/integration/**` from test discovery so `bun test` at root only runs route-layer tests. Integration tests must be run explicitly via `bun run test:integration`.

## How to Run

```bash
# Run all route-layer tests (backend + privacy-proxy) from root
bun test

# Same, via package.json script
bun run test

# Run only backend route-layer tests
cd backend && bun test --path-ignore-patterns='**/integration/**'

# Run only privacy-proxy route-layer tests
cd privacy-proxy && bun test

# Run live integration tests (requires backend + proxy containers running)
bun run test:integration
```

---

## Backend Route-Layer Tests (13 files, 138 tests)

### 1. `backend/tests/Anonymous-submission.test.ts` (13 tests)
**Type**: Route-layer, **No mocks** -- uses inline Elysia handler stub

**What it tests**: `POST /api/complaints/anonymous/submit` schema validation and Cosmos config.

**How it works**: Builds an inline Elysia app with the same `t.Object` body schema as the real route. The handler generates a mock tracking code (`SAWTAK-XXXX`) and transaction ID. Tests send real `Request` objects through `app.handle()`.

**Validation tests** (expect `422`):
- Missing `anonymousIdentifier`
- Title < 5 chars
- Text < 20 chars
- Missing `category`
- Title > 200 chars
- Text > 10000 chars

**Success tests** (expect `200`):
- Minimal fields only (`anonymousIdentifier`, `title`, `text`, `category`)
- All optional fields (`area`, `directedTo` with ministry/governorate/center, `incidentDate`, `evidenceCids`)
- Empty `evidenceCids` array
- 5 consecutive submissions produce unique tracking codes (regex: `SAWTAK-[A-Z2-9]{6,8}`)

**Config tests** (dynamic `import()`):
- Verifies `COSMOS_CONFIG.RPC_ENDPOINT`, `CHAIN_ID`, `PREFIX === "sawtak"` exist
- Verifies `CosmosIndexerService` is instantiable with `getStatus()` method

---

### 2. `backend/tests/auth.routes.test.ts` (8 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub

**What it tests**: Auth route validation for login, OAuth callbacks, and JWT verification.

**How it works**: Three separate inline Elysia apps per auth flow, each with `@elysiajs/jwt` plugin using `"test-secret"`. Handlers return mock JWT/user objects for valid inputs.

**`POST /api/auth/login`** (4 tests):
- Valid body (`provider` + `token`) -> `200`, `success: true`
- Missing `provider` -> `422`
- Missing `token` -> `422`
- Non-JSON body -> `422`

**`POST /api/auth/google/callback`** (2 tests):
- Valid body (`code` + `redirect_uri`) -> `200`
- Missing `code` -> `422`

**`POST /api/auth/haweya/callback`** (2 tests):
- Valid body -> `200`
- Missing `redirect_uri` -> `422`

**`GET /api/auth/verify`** (3 tests):
- Uses a separate `signApp` with the same JWT secret to generate a real signed token, then sends it to `verifyApp`
- Missing `Authorization` header -> `401`
- Malformed JWT -> `401`
- Valid signed JWT -> `200`, returns decoded `userId: "user-123"`

---

### 3. `backend/tests/complaint-validation.routes.test.ts` (6 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub

**What it tests**: `POST /api/complaints/validate` AI validation endpoint schema.

**How it works**: Inline handler returns `{ verdict: "real" }` for valid input.

**Tests**:
- Valid body (`title`, `text`, `category`) -> `200`, `verdict: "real"`
- Missing `title` -> `422`
- Missing `text` -> `422`
- Missing `category` -> `422`
- Empty title (`minLength: 1` violation) -> `422`
- Non-JSON body -> `422`

---

### 4. `backend/tests/feed.routes.test.ts` (5 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub

**What it tests**: Feed endpoint query params, stats, and complaint-by-ID lookup.

**`GET /api/feed`** (3 tests):
- Empty query params -> `200`, returns empty complaints array with pagination structure
- All filter params (`search`, `category`, `area`, `dateFrom`, `dateTo`, `sort`, `page`, `limit`, `submissionMode`) -> `200`
- `directedTo` as JSON string -> `200`

**`GET /api/feed/stats`** (1 test):
- Returns `{ total, byCategory, byStatus }` structure -> `200`

**`GET /api/feed/:id`** (2 tests):
- Valid ID `"abc-123"` -> `200`, returns complaint data with matching ID
- ID `"not-found"` -> `404`, `error: "Complaint not found"`

---

### 5. `backend/tests/tracking.routes.test.ts` (5 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub

**What it tests**: Tracking code lookup and status history.

**`GET /api/track/:code`** (4 tests):
- Code < 8 chars (`minLength` violation) -> `422`
- Code containing `"anon"` -> `200`, `found: true`, `type: "anonymous"`
- Code containing `"identified"` -> `200`, `found: true`, `type: "identified"`
- Unknown code -> `200`, `found: false`

**SHA256 hash test** (1 test):
- Verifies `crypto.createHash("sha256").update(code).digest("hex").substring(0, 16)` produces a 16-char hex string

**`GET /api/track/:code/history`** (1 test):
- Returns status history array with 2 entries (status transitions with timestamps) -> `200`

---

### 6. `backend/tests/vote.routes.test.ts` (7 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub

**What it tests**: Vote toggle, vote count, batch vote endpoints.

**`POST /api/vote`** (3 tests):
- Missing auth header -> `401`, `requiresLogin: true`
- Valid auth + `complaintId` -> `200`, `voted: true`, `newCount: 5`
- Missing `complaintId` -> `422`

**`GET /api/vote/:complaintId`** (2 tests):
- No auth -> `200`, `hasVoted: false`
- With auth (JWT payload contains `userId`) -> `200`, `hasVoted: true`

**`GET /api/vote/status?complaintId=xxx`** (2 tests):
- Valid `complaintId` query param -> `200`
- Missing `complaintId` -> `422`

**`POST /api/vote/batch`** (2 tests):
- Valid `complaintIds` array -> `200`, returns vote count for each ID
- Missing `complaintIds` -> `422`

---

### 7. `backend/tests/admin.routes.test.ts` (18 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub (factory via `createMockAdminApp()`)

**What it tests**: Full admin CRUD routes -- complaint management, user management, identity reveal requests.

**`GET /api/admin/complaints`** (7 tests):
- Empty query -> `200`, defaults `page: 1`, `limit: 20`, includes `stats` object
- Pagination (`page=2`, `limit=10`) -> `200`, returns correct values
- Search filter -> `200`
- Status filter -> `200`
- Entity filter (ministry, governorate) -> `200`
- Response includes `stats` with `submitted`, `investigating`, `closed` fields

**`PATCH /api/admin/complaints/:id/status`** (5 tests):
- Missing `status` -> `400`
- Invalid status value -> `400`, lists valid options
- Valid status (`"investigating"`) -> `200`
- Status `"closed"` without `note` -> `400`, `"Comment is required"`
- Status `"closed"` with `note` -> `200`

**`POST /api/admin/complaints/:id/escalate`** (3 tests):
- Invalid priority -> `400`
- All valid priorities (`low`, `medium`, `high`, `urgent`) -> `200`
- With optional `note` + `toUserId` -> `200`

**`GET /api/admin/stats`** (1 test):
- Returns `{ total, identified, anonymous, byStatus }` -> `200`

**`GET /api/admin/users`** (3 tests):
- Pagination -> `200`
- Search by email -> `200`
- Blocked filter -> `200`

**`POST /api/admin/complaints/:id/request-identity-reveal`** (3 tests):
- Reason < 10 chars -> `400`
- Missing reason -> `422`
- Valid reason (10+ chars) -> `200`, returns `requestId`

**`GET /api/admin/identity-reveal-requests`** (1 test):
- With `status=pending` filter -> `200`, returns `requests` array

---

### 8. `backend/tests/team.routes.test.ts` (10 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub (factory via `createMockTeamApp()`)

**What it tests**: Team CRUD, member management, entity lookups.

**`GET /api/admin/teams`** (1 test):
- Returns empty teams list -> `200`

**`POST /api/admin/teams`** (5 tests):
- Invalid type -> `422` (Elysia schema rejects via `t.Union` literal types)
- Valid `ministry` type -> `200`
- Valid `governorate` type -> `200`
- Valid `center` type -> `200`
- Missing `entityId` -> `422`

**`GET /api/admin/teams/available-entities`** (1 test):
- Returns `{ ministries, governorates }` -> `200`

**`GET /api/admin/teams/my-teams`** (1 test):
- Returns user's team memberships -> `200`

**`GET /api/admin/teams/:id`** (2 tests):
- Valid ID -> `200`, returns team details
- ID `"not-found"` -> `404`

**`POST /api/admin/teams/:id/members`** (2 tests):
- Valid roles (`reviewer`, `manager`, `team_admin`) -> `200`
- Invalid role -> `400`

**`PATCH /api/admin/teams/:id/members/:userId`** (2 tests):
- Valid role update -> `200`
- Invalid role -> `400`

---

### 9. `backend/tests/identified-complaint.routes.test.ts` (11 tests)
**Type**: Route-layer, **No mocks** -- inline Elysia handler stub (factory via `createMockIdentifiedApp()`)

**What it tests**: `POST /api/complaints/identified/submit` and `GET /user/:userId`.

**Validation** (5 tests, all expect `422`):
- Missing `userId`
- Title < 5 chars
- Text < 20 chars
- Missing `category`
- Invalid `visibility` value (`"secret"` -- schema uses `t.Union([t.Literal("public"), t.Literal("private")])`)

**Success** (5 tests, expect `200`):
- Minimal fields -> returns `id`, `status: "submitted"`
- Public visibility -> `visibility: "public"`
- Private visibility -> `visibility: "private"`
- All optional fields (`area`, `directedTo`, `incidentDate`, `evidenceUrls`)
- Ministry `directedTo` type
- Empty `evidenceUrls` array

**User complaints** (1 test):
- `GET /user/user-123` -> `200`, returns array of complaints

---

### 10. `backend/tests/upload-evidence.test.ts` (7 tests)
**Type**: Route-layer, **Uses `globalThis.fetch` mock** -- imports the **real** `uploadEvidenceRoutes` from source

**What it tests**: Real route handler for `POST /api/upload/ipfs` that calls Pinata API.

**How it works**: Uses the **actual** route implementation from `src/routes/upload-evidence.routes.ts`. Sets `process.env.PINATA_JWT` to a mock value to pass the route's config check. Overrides `globalThis.fetch` per test to intercept Pinata API calls. Resets to native `fetch` in `afterEach`.

**Tests**:
- File > 50MB -> `400`, `"File large_file.txt exceeds the 50MB limit."` (no fetch called)
- No files in FormData -> `400`, `"No files provided."` (no fetch called)
- Successful upload (fetch returns `200` with `{ IpfsHash: "QmMockHash123456789" }`) -> `200`, returns hash + gateway URL
- Pinata 403 failure (fetch returns `403`) -> `500`, `success: false`
- Pinata network error (fetch throws `Error`) -> `500`, `success: false`
- Multiple files (3 fetch calls returning different hashes) -> `200`, returns 3 hashes + 3 URLs
- Partial failure (first succeeds, second returns `429`) -> `500`, `success: false` (via `Promise.all` rejection)

---

### 11. `backend/tests/cosmos-indexer.test.ts` (19 tests)
**Type**: Route-layer, **No mocks** -- imports the **real** `CosmosIndexerService`

**What it tests**: Cosmos indexer service lifecycle, singleton, event routing, JSON parsing, RPC URL construction, and config.

**Constructor** (4 tests):
- Instance creation -> defined
- Initial `isRunning` -> `false`
- `rpcEndpoint` in status -> defined string
- `lastHeight` -> `>= 0`

**Lifecycle** (2 tests):
- Stop on non-running -> no throw
- Stop after creation -> `isRunning: false`

**Singleton** (1 test):
- `getIndexer()` returns same instance on repeated calls

**Event Type Routing** (4 tests):
- `"EventSubmitAnonymousComplaint"` recognized
- `"EventSubmitIdentifiedComplaint"` recognized
- `"EventUpdateComplaintStatus"` recognized
- `"UnknownEvent"` not in known types list

**Status Reporting** (1 test):
- Full status object has `isRunning` (boolean), `lastHeight` (number), `rpcEndpoint` (string)

**JSON Parsing** (4 tests):
- Parses `directed_to` JSON string correctly
- Parses evidence JSON array correctly
- Empty string -> `null`
- Malformed JSON -> caught, returns `null`

**RPC URL Construction** (2 tests):
- Constructs `tx_search` URL with encoded query params, `per_page=50`
- `encodeURIComponent` produces correct encoding (`>=` becomes `%3E%3D`)

**Config** (4 tests):
- `RPC_ENDPOINT` starts with `"http"`
- `CHAIN_ID` contains `"sawtak"`
- `PREFIX === "sawtak"`
- `GAS_PRICE` defined

---

### 12. `backend/tests/cosmos-multi-node.test.ts` (3 tests)
**Type**: **Live integration** (requires DB + Cosmos nodes), **Auto-skips** if unavailable

**What it tests**: Full loop from Cosmos chain submission -> indexer -> Postgres persistence, plus multi-node sync.

**How it works**: `beforeAll` checks DB connectivity via `prisma.$queryRaw\`SELECT 1\``. If DB unavailable, logs skip message and all tests return early. If Cosmos SDK unavailable during dynamic `import()`, also skips. Uses `upsert` to create a test user.

**Anonymous Complaint** (1 test, 60s timeout):
- Submits complaint via `AnonymousSubmissionService.submitAnonymousComplaint()`
- Polls Postgres `indexedComplaint` table every 5s (up to 4 attempts = 20s) for the transaction hash
- Asserts `chain_type === "cosmos"` and title matches

**Identified Complaint** (1 test):
- Creates complaint via `IdentifiedComplaintService.createComplaint()`
- Asserts `id` defined, `user_id` matches test user, `status: "submitted"`

**Multi-Node Sync** (1 test, 60s timeout):
- Submits complaint, verifies Node 1 has it via `/tx?hash=` RPC call
- Waits 10s for replication, checks Node 2 (port `26658`)
- Handles Node 2 being in sync-progress gracefully

---

### 13. `backend/src/middleware/proxy-auth.test.ts` (5 tests)
**Type**: Route-layer, **No mocks** -- imports the **real** `proxyAuthMiddleware`

**What it tests**: Trust boundary enforcement -- backend only accepts requests from the privacy proxy.

**How it works**: Wraps real middleware in minimal Elysia app. Sets `process.env` variables per test, restores in `afterEach`.

**Tests**:
- Missing `X-Proxy-Secret` header (with `REQUIRE_PROXY_AUTH=true`) -> `403`, `"Direct backend access is not allowed"`
- Invalid `X-Proxy-Secret` -> `403`
- Valid secret + `x-proxy-request-id` + `x-proxy-session-id` -> `200`, returns proxy context values, `isProxied: true`
- `REQUIRE_PROXY_AUTH=true` but `PROXY_SECRET=""` -> `500`, `"Server misconfiguration: proxy secret not set"`
- `REQUIRE_PROXY_AUTH=false` -> `200` (fail-open for dev mode, allows direct access)

---

## Privacy-Proxy Route-Layer Tests (6 files, 46 tests)

### 14. `privacy-proxy/src/policies/headers.policy.test.ts` (9 tests)
**Type**: Route-layer, **No mocks** -- tests pure policy functions

**What it tests**: Header allowlists, blocklists, proxy header constants, and `filterHeaders()` function.

**ALLOWED_HEADERS** (3 tests):
- Contains `"authorization"`
- Contains `"content-type"`
- Does NOT contain `"x-forwarded-for"`

**BLOCKED_HEADERS** (4 tests):
- Contains `"x-forwarded-for"`, `"user-agent"`, `"referer"`, `"cf-connecting-ip"`

**PROXY_HEADERS** (3 tests):
- `SECRET === "x-proxy-secret"`
- `REQUEST_ID === "x-proxy-request-id"`
- `SESSION_ID === "x-proxy-session-id"`

**filterHeaders()** (4 tests):
- Input with mix of allowed + blocked headers -> returns only allowed in `sanitized` object
- 3 blocked headers -> `strippedCount: 3`
- Identifies which blocked header names were encountered (`blockedNames`)
- Empty input -> empty `sanitized`, `strippedCount: 0`

---

### 15. `privacy-proxy/src/policies/routes.policy.test.ts` (9 tests)
**Type**: Route-layer, **No mocks** -- tests pure route policy functions

**What it tests**: Route pattern matching, body size limits, allowed methods per route.

**findRoutePolicy()** (7 tests):
- `/api/upload` -> matches upload policy, `maxBodySize: 50MB`, allows `POST`
- `/api/complaints/anonymous/submit` -> `maxBodySize: 1MB`
- `/api/auth/verify` -> matches `/api/auth` pattern, allows `GET` + `POST`
- `/api/feed?page=1` -> matches `/api/feed`, `maxBodySize: 0` (GET-only), allows `GET`
- `/api/health` -> allows `GET`, NOT `POST`
- Unknown route `/api/vote/status` -> falls back to `DEFAULT_POLICY` (`maxBodySize: 10MB`)
- First-match priority: specific route `/api/complaints/anonymous/submit` wins over generic `/api/`

**ROUTE_POLICIES** (2 tests):
- Exactly 6 policies defined
- All policies have `pattern`, `maxBodySize`, `methods`, `description`

---

### 16. `privacy-proxy/src/middleware/sanitizer.middleware.test.ts` (8 tests)
**Type**: Route-layer, **No mocks** -- imports the **real** `sanitizeRequest()` function

**What it tests**: Request sanitization -- method validation, size checks, header stripping, proxy header injection.

**Tests**:
- GET `/api/feed?page=1` -> `allowed: true`, injects proxy secret, session ID, request ID, overrides `user-agent` to `"Sawtak-Proxy/1.0"`
- PUT `/api/feed` -> `allowed: false`, `status: 405`, reason contains `"not allowed"`
- POST `/api/upload` with `content-length: 60000000` -> `allowed: false`, `status: 413`, reason contains `"too large"`
- POST `/api/upload` with `content-length: 1000` -> `allowed: true`
- POST `/api/auth/login` with `x-forwarded-for` + `user-agent` + `referer` -> strips all 3, keeps `authorization` + `content-type`, injects proxy headers
- Tracks `strippedHeaderCount: 3` (x-forwarded-for, user-agent, referer)
- POST `/api/health` -> `405` (health only allows GET)
- OPTIONS `/api/upload` -> `allowed: true` (CORS preflight)

---

### 17. `privacy-proxy/src/middleware/session.middleware.test.ts` (7 tests)
**Type**: Route-layer, **No mocks** -- tests pure session functions

**What it tests**: Session ID generation, cookie parsing, cookie building.

**resolveSession()** (6 tests):
- `null` cookie -> `isNew: true`, generates UUID v4 format
- Valid `sawtak_sid=<uuid>` cookie -> `isNew: false`, extracts session ID
- Invalid format `sawtak_sid=not-a-uuid` -> `isNew: true`
- Empty cookie string -> `isNew: true`
- Wrong cookie name `other_sid=<valid-uuid>` -> `isNew: true`
- Two consecutive `null` calls -> different session IDs

**buildSessionCookie()** (1 test):
- Returns cookie string containing `sawtak_sid=<id>`, `Path=/`, `Max-Age=86400`, `HttpOnly`, `SameSite=Strict`

---

### 18. `privacy-proxy/src/proxy/forwarder.test.ts` (5 tests)
**Type**: Route-layer, **Uses `globalThis.fetch` mock** -- imports the **real** `forwardRequest()` function

**What it tests**: The actual request forwarding logic that sends sanitized requests to the backend.

**How it works**: Overrides `globalThis.fetch` per test to capture forwarded URL, method, headers, and body. Restores after each test.

**Tests**:
- GET `/api/feed?page=1` with proxy secret -> forwards to `http://localhost:8000/api/feed?page=1` with correct method + headers, returns `200`
- Backend connection refused (fetch throws) -> `success: false`, `status: 502`, error contains `"Backend unavailable"`
- POST with body stream -> captures body in forwarded request options, returns `success: true`
- Response hop-by-hop headers (`Connection`, `Transfer-Encoding`) -> filtered out, only `Content-Type` kept
- Latency measurement -> `latencyMs >= 0`

---

### 19. `privacy-proxy/src/services/rate-limiter.test.ts` (3 tests)
**Type**: Route-layer, **Requires live Redis** -- imports real `ProxyRateLimiter`, **auto-skips** if Redis unavailable

**What it tests**: Redis-based rate limiting for proxy endpoints.

**How it works**: `beforeAll` attempts to connect to Redis using config values. If connection fails, all tests skip with console warning. Cleans up Redis keys matching `ratelimit:proxy:*` before running.

**Tests** (all skip if Redis unavailable):
- Anonymous complaint limit: 5 per hour per session -> first 5 allowed (`remaining: 4` down to `0`), 6th blocked (`allowed: false`, `limit: 5`)
- Auth endpoint limit: 10 per minute per IP -> first 10 allowed, 11th blocked
- General API token bucket: 100 per window per session+IP -> first 100 allowed, 101st blocked

---

## Integration Tests (1 file, 23 tests)

### 20. `backend/tests/integration/proxy-pipeline.test.ts` (23 tests)
**Type**: **Live integration**, **No mocks** -- hits real `http://localhost:4000` proxy

**What it tests**: End-to-end pipeline: client -> privacy proxy -> backend -> DB/Cosmos.

**How it works**: `beforeAll` probes `/api/health` and `/api/indexer/status` to determine if backend and Cosmos are available. Individual tests use `skipIfBackendDown()` or `if (!cosmosAvailable) return` to skip gracefully. Uses flexible status assertions (`[200, 401, 403].toContain(res.status)`) because proxy vs direct backend may differ.

**Health & Connectivity** (2 tests):
- `/api/health` -> `200`, `status: "ok"`, `service: "sawtak-backend"`
- `/api/indexer/status` -> `200`, includes `cosmos` and `hedera` status objects

**Feed Endpoints** (5 tests):
- `GET /api/feed?page=1&limit=10` -> `200`, pagination structure
- Category filter -> `200`
- Area filter -> `200`
- Search query -> `200`
- `/api/feed/stats` -> `200`, data present

**Vote Endpoints** (1 test):
- `/api/vote/status` -> `200` or `422` (flexible)

**Tracking Endpoint** (2 tests):
- Invalid tracking code -> `404`
- Malformed code -> `400`, `404`, or `422` (flexible)

**Authentication Endpoints** (2 tests):
- Login with empty body -> `401` or `422`
- Google callback with empty body -> `401` or `422`

**Protected Endpoints** (2 tests):
- Anonymous submit with invalid token -> `400`, `401`, `403`, or `422`
- Upload through proxy -> `200`, `400`, or `401` (depends on Pinata config)

**Complaint Validation Through Proxy** (3 tests):
- Short title/oversized title with invalid auth -> `401`, `403`, or `422`

**Cosmos Indexer** (3 tests, skip if Cosmos down):
- Running status -> `isRunning: true`, `lastHeight > 0`
- Stop + restart cycle -> back to running
- Reindex validation -> `400`, `401`, or `403`

**Proxy Header Stripping** (2 tests):
- Request with `x-forwarded-for` + `x-real-ip` -> `200` (proxy strips them)
- Request with custom `user-agent` -> `200` (proxy replaces it)

**Error Handling** (2 tests):
- Unknown route -> `404` or `502`
- Malformed `Content-Type` -> status `< 500` (graceful error, not crash)

---

## Test Classification Summary

| Strategy | Files | Tests | Description |
|----------|-------|-------|-------------|
| **Inline stub (no mocks, no real imports)** | 8 | 70 | Anonymous, Auth, Validation, Feed, Tracking, Vote, Admin, Team, Identified Complaint |
| **Real import (no mocks)** | 3 | 28 | Cosmos Indexer, Proxy Auth, Sanitizer |
| **`globalThis.fetch` mock** | 2 | 12 | Upload Evidence, Forwarder |
| **Live integration (no mocks, auto-skip)** | 2 | 26 | Cosmos Multi-Node, Proxy Pipeline |
| **Pure function (no mocks)** | 3 | 25 | Header Policies, Route Policies, Session |
| **Live Redis (auto-skip)** | 1 | 3 | Rate Limiter |

## Config

- **`bunfig.toml`** at root: `pathIgnorePatterns = ["**/integration/**"]` excludes integration tests from `bun test` discovery.
- **`rate-limiter.ts`**: `connect()` has a 3s timeout and no retries to prevent DNS lookup hangs when the Redis hostname is unreachable from the test runner.
- **`forwarder.test.ts`**: Uses `config.backendUrl` dynamically instead of hardcoding the backend URL, so it works regardless of environment.
