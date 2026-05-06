# Sawtak Privacy Proxy: Security & Architecture Rundown

## Executive Summary
Sawtak has implemented a **Privacy Proxy Ingress Layer** to safeguard user anonymity and harden the platform against metadata leakage and infrastructure exposure. This document explains the technical architecture, trust boundaries, and security policies that ensure the system is safe, valid, and reliable for the whistleblowing community.

---

## 1. The Multi-Tier Architecture
The platform is divided into three distinct network zones, ensuring that even if one layer is compromised, the others remain protected.

### Network Flow:
1.  **Public Ingress (Zone 1):** The user connects to the **Frontend** (Next.js) or the **Privacy Proxy** (Elysia).
2.  **The Privacy Bridge (Zone 2):** All API traffic is routed through the Privacy Proxy. This layer acts as a "scrubbing station" for metadata.
3.  **The Data Plane (Zone 3):** The **Backend** and **Databases** live in an isolated network. They have NO public IP addresses and NO exposed ports to the internet.

---

## 2. Frontend: Same-Origin Privacy
To prevent the browser from leaking metadata (like CORS preflight headers or the absolute location of the backend), we use a **Same-Origin API** strategy.

-   **Relative Paths:** The frontend code never uses absolute URLs (e.g., `https://api.sawtak.app`). Instead, it fetches from `/api/...`.
-   **Next.js Rewrites:** The Next.js server acts as an internal router. When it receives a request for `/api`, it proxies it internally to `http://privacy-proxy:4000`.
-   **Impact:** The browser believes it is talking to a single origin. No third-party network requests are visible in the network tab, and metadata leakage is minimized at the source.

---

## 3. The Proxy: Edge Sanitization & Throttling
The Privacy Proxy is a high-performance Elysia service designed for one purpose: **Sanitization.**

### A. Header Stripping
The proxy enforces a strict "Allow-List" policy. Before a request reaches the backend, the following sensitive headers are **permanently stripped**:
-   `User-Agent` (Prevents browser fingerprinting)
-   `Referer` / `Origin` (Prevents tracking the source site)
-   `Sec-Ch-Ua-*` (Client hints)
-   `X-Forwarded-For` (The proxy replaces this with a generic identifier or strips it to hide the real client IP)

### B. Edge Rate Limiting
Rate limiting is handled at the **edge** (Proxy) rather than the **core** (Backend).
-   **Mechanism:** Uses a Redis-backed sliding window algorithm.
-   **Anonymous complaints:** Limited by a cryptographically secure Session ID.
-   **Identified complaints:** Limited by User ID.
-   **Security:** This prevents DDoS attacks and "brute-force submission" attempts from ever reaching the main backend processing engine.

---

## 4. The Backend: The Trust Boundary
The Backend is hardened using a **Shared Secret Trust Boundary.**

### X-Proxy-Secret Validation
The Backend and Proxy share a `PROXY_SECRET`.
-   **Enforcement:** Every request from the Proxy to the Backend includes a signed `X-Proxy-Secret` header.
-   **Rejection:** The Backend uses a mandatory middleware (`proxy-auth.middleware.ts`) that checks this secret. If a request arrives without it (i.e., someone trying to bypass the proxy), the Backend returns a `403 Forbidden` and drops the connection.
-   **Network Isolation:** In production (Podman/Docker), the backend has **zero exposed ports**. It is physically impossible to route traffic to it except through the proxy bridge.

---

## 5. Why It Is Reliable
-   **Fail-Safe Design:** If the `PROXY_SECRET` is missing or misconfigured, the backend defaults to a "Forbidden" state rather than an "Open" state.
-   **Extensive Testing:** We have implemented a regression test suite (`backend/src/middleware/proxy-auth.test.ts`) that simulates various bypass attempts (missing headers, wrong secrets, environment changes) to ensure the shield never fails.
-   **Performance:** By moving rate limiting and sanitization to a dedicated proxy layer, the core backend can focus entirely on blockchain indexing and business logic, leading to better overall system stability.

---

## 6. Conclusion for the Community
The Sawtak Privacy Proxy ensures that:
1.  **No IP Logs:** The backend never sees the user's real IP address.
2.  **No Fingerprinting:** Browser metadata is scrubbed at the edge.
3.  **No Direct Exposure:** The core infrastructure is invisible to the public internet.

This architecture represents a state-of-the-art approach to whistleblowing security, prioritizing user safety above all else.
