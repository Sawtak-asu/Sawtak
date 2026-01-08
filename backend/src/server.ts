import "dotenv/config";

// Initialize telemetry/metrics
import { initTelemetry, getPrometheusMetrics } from "./telemetry";

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { requestLogger } from "./middleware/request-logger.middleware";
import { authRoutes } from "./routes/auth.routes";
import { anonymousComplaintRoutes } from "./routes/anonymous-complaint.routes";
import { identifiedComplaintRoutes } from "./routes/identified-complaint.routes";
import { feedRoutes } from "./routes/feed.routes";
import { indexerRoutes } from "./routes/indexer.routes";
import { adminRoutes } from "./routes/admin.routes";
import { trackingRoutes } from "./routes/tracking.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { voteRoutes } from "./routes/vote.routes";
import { startIndexer } from "./services/hedera-indexer.service";
import { rateLimiter } from "./services/rate-limiter.service";
import { openapi } from '@elysiajs/openapi'

const startTime = Date.now();

/**
 * Bootstrap the application
 */
async function bootstrap() {
  // Initialize telemetry/metrics
  await initTelemetry();

  // Initialize Redis connection for rate limiting
  const redisConnected = await rateLimiter.connect();
  if (!redisConnected) {
    console.warn("⚠️ Starting without Redis - rate limiting disabled");
  }

  const app = new Elysia()
    .use(swagger({
      documentation: {
        info: {
          title: "Sawtak API",
          version: "1.0.0",
          description: `
# Sawtak - Anonymous Whistleblowing Platform API

Sawtak is a blockchain-secured whistleblowing platform that allows citizens to report misconduct anonymously or with verified identity.

## Key Features

- **Anonymous Submissions**: Complaints stored on Hedera blockchain with no IP logging
- **Identified Submissions**: Linked to user accounts for direct follow-up
- **Immutable Records**: Blockchain ensures complaints cannot be deleted or altered
- **Privacy by Design**: AES-256 encryption, no browser fingerprinting

## Authentication

Protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Tokens are obtained via the \`/api/auth/login\` or OAuth callback endpoints.

## Rate Limits

- Anonymous complaints: 5 per hour
- Identified complaints: 20 per hour  
- API requests: 100 per hour (unauthenticated), 1000 per hour (authenticated)
- File uploads: 10 per hour

## Blockchain Verification

Anonymous complaints can be verified on the Hedera network:
- **Topic ID**: ${process.env.HEDERA_TOPIC_COMPLAINTS || "0.0.XXXXXXX"}
- **Network**: ${process.env.HEDERA_NETWORK || "testnet"}
- **Explorer**: https://hashscan.io
          `,
          contact: {
            name: "Sawtak Team",
            email: "support@sawtak.app"
          },
          license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT"
          }
        },
        tags: [
          { name: "Authentication", description: "OAuth login and token management" },
          { name: "Anonymous Complaints", description: "Submit anonymous complaints to the blockchain" },
          { name: "Identified Complaints", description: "Submit identified complaints linked to user accounts" },
          { name: "Public Feed", description: "Browse public complaints" },
          { name: "Tracking", description: "Track complaint status using tracking codes" },
          { name: "Voting", description: "Upvote public complaints" },
          { name: "File Upload", description: "Upload evidence files" },
          { name: "Admin", description: "Admin endpoints for complaint management" },
          { name: "Indexer", description: "Hedera blockchain indexer management" }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "Enter your JWT token"
            }
          }
        }
      },
      path: "/swagger",
      exclude: ["/metrics", "/"]
    }))
    .use(cors())
    .use(requestLogger) // Log all requests
    .use(authRoutes)
    .use(anonymousComplaintRoutes)
    .use(identifiedComplaintRoutes)
    .use(feedRoutes)
    .use(indexerRoutes)
    .use(adminRoutes)
    .use(trackingRoutes)
    .use(uploadRoutes)
    .use(voteRoutes)
    .get("/", () => "Sawtak API v1.0.0 - Visit /swagger for documentation", {
      detail: {
        hide: true
      }
    })

.get("/api/health", async () => {
      const redisHealth = await rateLimiter.healthCheck();
      return {
        status: "healthy",
        service: "sawtak-backend",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        redis: redisHealth,
      };
    }, {
      detail: {
        tags: ["System"],
        summary: "Health Check",
        description: "Check if the API is healthy and running"
      }
    })
    // Prometheus metrics endpoint for Grafana
    .get("/metrics", ({ set }) => {
      set.headers["content-type"] = "text/plain; charset=utf-8";
      return getPrometheusMetrics();
    }, {
      detail: {
        hide: true
      }
    })
    .listen(process.env.PORT || 8000);

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
  console.log(
    `📚 Swagger docs available at http://${app.server?.hostname}:${app.server?.port}/swagger`
  );

  // Auto-start the Hedera indexer
  if (process.env.ENABLE_INDEXER !== "false") {
    startIndexer();
  }
}

// Start the application
bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

