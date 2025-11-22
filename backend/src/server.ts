import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.routes";
import { anonymousComplaintRoutes } from "./routes/anonymous-complaint.routes";
import { identifiedComplaintRoutes } from "./routes/identified-complaint.routes";
import { adminRoutes } from "./routes/admin.routes";
import { publicRoutes } from "./routes/public.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { googleAuthRoutes } from "./routes/google-auth.routes";

import { proxyMiddleware } from "./middleware/proxy.middleware";

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .use(proxyMiddleware)
  .use(authRoutes)
  .use(googleAuthRoutes)
  .use(anonymousComplaintRoutes)
  .use(identifiedComplaintRoutes)
  .use(adminRoutes)
  .use(publicRoutes)
  .use(uploadRoutes)
  .get("/", () => "Sawtak backend :p")
  .listen(process.env.PORT || 8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
