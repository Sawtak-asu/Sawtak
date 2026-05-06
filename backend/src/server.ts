import "dotenv/config";

// Initialize telemetry/metrics
import { initTelemetry, getPrometheusMetrics } from "./telemetry";

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { requestLogger } from "./middleware/request-logger.middleware";
import { proxyAuthMiddleware } from "./middleware/proxy-auth.middleware";
import { authRoutes } from "./routes/auth.routes";
import { anonymousComplaintRoutes } from "./routes/anonymous-complaint.routes";
import { identifiedComplaintRoutes } from "./routes/identified-complaint.routes";
import { feedRoutes } from "./routes/feed.routes";
import { indexerRoutes } from "./routes/indexer.routes";
import { adminRoutes } from "./routes/admin.routes";
import { trackingRoutes } from "./routes/tracking.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { uploadEvidenceRoutes } from "./routes/upload-evidence.routes";
import { voteRoutes } from "./routes/vote.routes";
import { teamRoutes } from "./routes/team.routes";
import { complaintValidationRoutes } from "./routes/complaint-validation.routes";
import { startIndexer as startHederaIndexer } from "./services/hedera-indexer.service";
import { startIndexer as startCosmosIndexer } from "./services/cosmos-indexer.service";
import { prisma } from "./db";
import { openapi } from '@elysiajs/openapi'

const startTime = Date.now();

/**
 * Bootstrap the application
 */
async function bootstrap() {
  // Initialize telemetry/metrics
  await initTelemetry();

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

- **Anonymous Submissions**: Complaints stored on Cosmos blockchain with no IP logging
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

Anonymous complaints can be verified on the Cosmos network:
- **Chain ID**: ${process.env.COSMOS_CHAIN_ID || "sawtak-testnet"}
- **RPC Endpoint**: ${process.env.COSMOS_RPC_ENDPOINT || "http://localhost:26657"}
- **REST Endpoint**: ${process.env.COSMOS_REST_ENDPOINT || "http://localhost:1317"}
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
          { name: "Complaint Validation", description: "AI-powered pre-submission complaint validation" },
          { name: "Public Feed", description: "Browse public complaints" },
          { name: "Tracking", description: "Track complaint status using tracking codes" },
          { name: "Voting", description: "Upvote public complaints" },
          { name: "File Upload", description: "Upload evidence files" },
          { name: "Admin", description: "Admin endpoints for complaint management" },
          { name: "Indexer", description: "Cosmos blockchain indexer management" }
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
    .use(proxyAuthMiddleware) // Validate proxy trust boundary
    .use(requestLogger) // Log all requests
    .use(authRoutes)
    .use(anonymousComplaintRoutes)
    .use(identifiedComplaintRoutes)
    .use(feedRoutes)
    .use(indexerRoutes)
    .use(adminRoutes)
    .use(trackingRoutes)
    .use(uploadRoutes)
    .use(uploadEvidenceRoutes)
    .use(voteRoutes)
    .use(teamRoutes)
    .use(complaintValidationRoutes)
    .get("/", () => "Sawtak API v1.0.0 - Visit /swagger for documentation", {
      detail: {
        hide: true
      }
    })

    .get("/api/health", async ({ set }) => {
      // Add Prisma DB check
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (e) {
        set.status = 503;
        return { status: "error", message: "Database connection failed" };
      }

      return {
        status: "ok",
        service: "sawtak-backend",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
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
    // Prometheus metrics endpoint for Grafana (via proxy)
    .get("/api/metrics", ({ set }) => {
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

  // Auto-start the indexers
  if (process.env.ENABLE_INDEXER !== "false") {
    if (process.env.ENABLE_HEDERA_INDEXER === "true") {
      startHederaIndexer();
    }
    if (process.env.COSMOS_CHAIN_ID) {
      startCosmosIndexer();
    }
  }
}

// Start the application
bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

