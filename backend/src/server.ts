import "dotenv/config";

// Initialize telemetry/metrics
import { initTelemetry, getPrometheusMetrics } from "./telemetry";

import { Elysia } from "elysia";
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
import { startIndexer } from "./services/hedera-indexer.service";

const startTime = Date.now();

/**
 * Bootstrap the application
 */
async function bootstrap() {
  // Initialize telemetry/metrics
  await initTelemetry();

  const app = new Elysia()
    .use(swagger())
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
    .get("/", () => "Sawtak backend :p")
    // Health check endpoint for Docker/Kubernetes
    .get("/api/health", () => ({
      status: "healthy",
      service: "sawtak-backend",
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    }))
    // Prometheus metrics endpoint for Grafana
    .get("/metrics", ({ set }) => {
      set.headers["content-type"] = "text/plain; charset=utf-8";
      return getPrometheusMetrics();
    })
    .listen(process.env.PORT || 8000);

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
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

