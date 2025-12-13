import "dotenv/config";
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { anonymousComplaintRoutes } from "./routes/anonymous-complaint.routes";
import { identifiedComplaintRoutes } from "./routes/identified-complaint.routes";
import { feedRoutes } from "./routes/feed.routes";
import { indexerRoutes } from "./routes/indexer.routes";
import { adminRoutes } from "./routes/admin.routes";
import { trackingRoutes } from "./routes/tracking.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { startIndexer } from "./services/hedera-indexer.service";

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .use(authRoutes)
  .use(anonymousComplaintRoutes)
  .use(identifiedComplaintRoutes)
  .use(feedRoutes)
  .use(indexerRoutes)
  .use(adminRoutes)
  .use(trackingRoutes)
  .use(uploadRoutes)
  .get("/", () => "Sawtak backend :p")
  .listen(process.env.PORT || 8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// Auto-start the Hedera indexer
if (process.env.ENABLE_INDEXER !== "false") {
  startIndexer();
}
