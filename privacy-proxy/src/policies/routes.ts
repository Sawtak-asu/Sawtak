/**
 * Route Policies for Privacy Proxy
 *
 * Defines per-route forwarding configuration including
 * body size limits and any route-specific overrides.
 */

import { config } from "../config";

export interface RoutePolicy {
  /** URL pattern (prefix match) */
  pattern: string;
  /** Maximum body size for this route (bytes) */
  maxBodySize: number;
  /** Whether this route requires authentication header */
  requiresAuth: boolean;
  /** HTTP methods allowed */
  methods: string[];
  /** Additional headers to allow for this route (beyond global allowlist) */
  extraAllowedHeaders?: string[];
  /** Route description for logging */
  description: string;
}

/**
 * Route-specific policies.
 * Checked in order — first match wins.
 * Routes not matching any policy use the default policy.
 */
export const ROUTE_POLICIES: RoutePolicy[] = [
  {
    pattern: "/api/upload",
    maxBodySize: 50 * 1024 * 1024, // 50MB for file uploads
    requiresAuth: true,
    methods: ["POST", "OPTIONS"],
    description: "File upload endpoint",
  },
  {
    pattern: "/api/complaints/anonymous/submit",
    maxBodySize: 1 * 1024 * 1024, // 1MB
    requiresAuth: true,
    methods: ["POST", "OPTIONS"],
    description: "Anonymous complaint submission",
  },
  {
    pattern: "/api/complaints/identified/submit",
    maxBodySize: 1 * 1024 * 1024, // 1MB
    requiresAuth: true,
    methods: ["POST", "OPTIONS"],
    description: "Identified complaint submission",
  },
  {
    pattern: "/api/auth",
    maxBodySize: 64 * 1024, // 64KB
    requiresAuth: false,
    methods: ["GET", "POST", "OPTIONS"],
    description: "Authentication endpoints",
  },
  {
    pattern: "/api/feed",
    maxBodySize: 0, // GET only, no body
    requiresAuth: false,
    methods: ["GET", "OPTIONS"],
    description: "Public complaint feed",
  },
  {
    pattern: "/api/health",
    maxBodySize: 0,
    requiresAuth: false,
    methods: ["GET"],
    description: "Health check",
  },
];

/** Default policy for routes that don't match any specific pattern */
export const DEFAULT_POLICY: RoutePolicy = {
  pattern: "/api/",
  maxBodySize: config.maxBodySize,
  requiresAuth: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  description: "Default API route",
};

/**
 * Find the applicable policy for a given path.
 * Returns the first matching route policy, or the default.
 */
export function findRoutePolicy(path: string): RoutePolicy {
  for (const policy of ROUTE_POLICIES) {
    if (path.startsWith(policy.pattern)) {
      return policy;
    }
  }
  return DEFAULT_POLICY;
}
