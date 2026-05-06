# Privacy Proxy Layer Plan (Phase 2)

## Problem
Sawtak currently lets clients call the backend API directly. The README target is a privacy proxy that is the only public entrypoint, strips metadata, and forwards sanitized requests to an internal-only backend. Redis rate limiting exists but is implemented in backend services/middleware today.

## Current State (what matters for this migration)
- Backend is publicly exposed in dev/prod compose and includes request logging that captures client IP.
- Frontend sends direct API requests using `NEXT_PUBLIC_API_URL` and bearer tokens from localStorage.
- Complaint payloads include client-supplied identity fields (`userId`, `anonymousIdentifier`), which should not be trusted from client.
- Rate-limit middleware exists, but currently appears unmounted in route composition; rate-limiting logic is present in Redis service.
- Production already uses Traefik; this is a good insertion point for routing to a dedicated privacy-proxy service.

## Architecture Decision (best approach now)
Build a dedicated **privacy-proxy service** (Bun + Elysia to match stack) and make it the only internet-facing API. Keep backend private on internal Docker network.

Why this approach now:
- Lowest operational friction with existing Bun/Elysia codebase and Docker setup.
- Lets us centralize sanitization + session-based controls in code (not just reverse-proxy config).
- Supports policy-rich behavior (header/body scrubbing, per-route policy, session issuance, observability).

## Target Data Flow
1. Client -> Privacy Proxy (public HTTPS).
2. Proxy assigns/reads anonymous session cookie, applies session/IP rate limits.
3. Proxy strips/redacts metadata headers before forwarding.
4. Proxy forwards only allowlisted headers and sanitized body.
5. Backend accepts traffic only from proxy network/credentials.
6. Backend business logic continues (auth, DB, blockchain), but no direct client metadata exposure.

## Networking Topology (Frontend + Privacy Layer + Backend + Blockchain)

### Trust zones
- **Zone A: Public Edge**
  - Privacy Proxy (public 443) as the single app ingress.
  - Optional public blockchain query endpoints (read-only).
- **Zone B: Application Internal**
  - Frontend service (internal only, no public port).
  - Backend API service (internal only, no public port).
  - Background workers/indexers.
- **Zone C: Data Internal**
  - PostgreSQL, Redis, object storage connectors (private).
- **Zone D: Blockchain**
  - Write path from backend signer/operator only.
  - Public read/query path for transparency (separate from write/signer path).

### External exposure policy
- **Publicly reachable**
  - `sawtak.<domain>` -> Privacy Proxy (serves app + API routing).
  - `chain.<domain>` / `rpc.<domain>` (if self-hosted chain queries are needed) -> read-only query nodes.
  - Public explorer links (e.g., Hedera/Hashscan) remain public by design.
- **Not publicly reachable**
  - Backend service.
  - Frontend container origin (if proxied by privacy layer).
  - PostgreSQL/Redis.
  - Validator/signer nodes and private operator endpoints.

### Request routing model (user talks only to new layer)
1. Browser hits `https://sawtak.<domain>` (Privacy Proxy).
2. Privacy Proxy routes:
   - `GET /`, static pages, assets -> internal Frontend service.
   - `/api/*` -> proxy privacy pipeline -> internal Backend service.
3. Browser never calls backend host/port directly.
4. Backend validates that request came from proxy (shared secret header now, mTLS later).

### Frontend tie-in model
- Frontend uses **same-origin** API calls (`/api/*`), so app traffic stays through privacy layer.
- Remove browser-exposed direct backend origin usage in runtime configuration.
- Prefer proxy-served frontend and API under one origin to reduce CORS complexity and metadata leakage.

### Blockchain transparency model
- Keep blockchain query path public, but separate it from app backend ingress.
- If using Hedera: transparency is provided by public network/explorer; app only exposes transaction/hash references.
- If using self-hosted Cosmos network:
  - expose **query nodes** publicly (REST/RPC query only),
  - keep validators and signing endpoints private,
  - ensure backend writes via private/internal path only.

### Network controls to enforce
- Backend container:
  - remove Traefik/public labels,
  - no host `ports:` binding,
  - attach to internal network only.
- Privacy Proxy container:
  - only public ingress entrypoint,
  - attached to both proxy/public and internal app networks.
- Firewall/SG policy:
  - inbound to backend allowed only from privacy-proxy subnet/service.
  - deny direct internet ingress to backend/data services.
- Egress policy:
  - backend allowed to blockchain APIs and required external services only.
  - privacy proxy egress limited to backend/frontend internal upstreams plus required observability.

### Recommended DNS and endpoint layout
- `sawtak.<domain>` -> Privacy Proxy (primary user endpoint)
- `api.<domain>` -> optional alias to Privacy Proxy (or deprecated after same-origin migration)
- `chain.<domain>` -> public chain query endpoint (optional, read-only)
- `grafana.<domain>`, `traefik.<domain>` -> admin-only protected endpoints

## Privacy Contract
- Backend must not receive: raw `X-Forwarded-*`, `CF-Connecting-IP`, `Referer`, full `User-Agent`.
- Backend may receive only controlled proxy headers:
  - `X-Proxy-Request-Id`
  - `X-Proxy-Session-Id` (opaque UUID, no PII)
  - `X-Proxy-Client-Class` (optional coarse bucket, e.g., web/mobile)
  - `Authorization` (only when endpoint requires auth)
- Client identity fields in body are ignored/removed:
  - `userId` stripped for identified submit; backend derives from JWT.
  - `anonymousIdentifier` stripped for anonymous submit; backend derives from authenticated user profile.

## Implementation Plan

### Phase 1: Proxy service skeleton + network isolation
- Add new service `privacy-proxy/` (Bun + Elysia).
- Add route passthrough for `/api/*` with strict upstream target to backend internal URL.
- Update Docker Compose:
  - Public router (Traefik) -> privacy-proxy only.
  - Backend removed from public router labels.
  - Backend on internal network only; allow only proxy service connectivity.
- Add shared env contracts for proxy/backend URLs and proxy shared secret.

### Phase 2: Request sanitization and forwarding policy
- Implement allowlist-based forwarding:
  - Keep: `authorization`, `content-type`, `accept`, minimal required CORS preflight headers.
  - Drop/redact: `x-forwarded-*`, `x-real-ip`, `cf-connecting-ip`, `referer`, high-entropy fingerprinting headers.
- Generate and inject proxy request/session headers.
- Add per-route body sanitizers:
  - `/api/complaints/identified/submit`: drop `userId`.
  - `/api/complaints/anonymous/submit`: drop `anonymousIdentifier`.
- Enforce max body size and upload limits in proxy before forwarding.

### Phase 3: Move rate limiting to proxy (Redis)
- Move active rate limiting decisions to proxy with Redis keys by:
  - Anonymous session (primary) + coarse IP fallback.
  - Route class (auth endpoints, uploads, complaint submits, public feed).
- Keep backend-side limits temporarily in observe-only mode (log mismatches, no hard block) during migration.
- After confidence window, remove backend enforcement path or keep as strict internal fallback keyed on proxy session.

### Phase 4: Backend trust-boundary hardening
- Backend accepts requests only if they include valid proxy auth signal (shared secret header or mTLS later).
- Update backend routes/controllers:
  - Stop requiring client-provided `userId` and `anonymousIdentifier` in request body.
  - Derive identity server-side from JWT/user record only.
- Update validators and OpenAPI schema to match new payload contracts.
- Update request logger to avoid logging direct client IP semantics; log proxy request/session IDs instead.

### Phase 5: Frontend alignment
- Frontend calls same-origin `/api/*` (no direct backend URL in browser runtime).
- Keep auth token handling initially unchanged for minimal risk (Bearer), then optionally move to httpOnly cookie in later hardening phase.
- Remove identity fields from submit payload construction in complaint form.

### Phase 6: Observability, security checks, rollout
- Add proxy metrics:
  - requests total, dropped headers count, sanitized field count, rate-limit blocks, upstream latency/errors.
- Add privacy regression tests:
  - Backend never receives blocked headers.
  - Submission succeeds without `userId`/`anonymousIdentifier` in body.
  - Direct backend internet path blocked.
- Rollout strategy:
  1. Dark launch proxy in front of non-critical routes.
  2. Full API cutover.
  3. Disable backend public ingress.
  4. Remove redundant legacy paths.

### Phase 7: Networking cutover and hardening
- Move frontend public ingress behind Privacy Proxy routing.
- Remove direct backend DNS/public route and any exposed backend ports.
- Publish/confirm blockchain public query endpoints (read-only) and document which endpoints are for transparency only.
- Apply firewall/SG/network-policy rules and validate no direct path to backend/data planes exists.
- Keep chain write path private and separate from public query infrastructure.

## Concrete File/Surface Changes
- New: `privacy-proxy/src/server.ts`, `privacy-proxy/src/policies/*`, `privacy-proxy/src/redis/*`.
- Update: `docker/docker-compose.prod.yml` (and dev compose variants) networking and router labels.
- Update: backend routes/controllers/validators:
  - `backend/src/routes/identified-complaint.routes.ts`
  - `backend/src/routes/anonymous-complaint.routes.ts`
  - `backend/src/validators/complaint.validator.ts`
  - `backend/src/middleware/request-logger.middleware.ts`
- Update: frontend payload and API usage:
  - `Front-end/app/[locale]/file-complaint/complaint-form.tsx`
  - optionally shared API utility to centralize `/api/*` calls.
- Update docs: root `README.md` and `backend/README.md` deployment + contract notes.

## Risks and mitigations
- **Risk:** Breaking auth/attachments through proxy forwarding.
  - **Mitigation:** Explicit route tests for OAuth callbacks, uploads, admin APIs.
- **Risk:** Over-sanitization removes required headers.
  - **Mitigation:** Header allowlist with route exceptions + staged rollout.
- **Risk:** Operational complexity from extra hop.
  - **Mitigation:** Keep proxy stateless except Redis session/rate-limit keys and expose health metrics.

## Branch and execution order
- Branch name: `feat/privacy-proxy-layer`.
- Execute phases in order; Phase 1 + Phase 2 are hard prerequisites for all others.
