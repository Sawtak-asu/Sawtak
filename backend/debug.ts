import { Elysia } from "elysia";
import { proxyAuthMiddleware } from "./src/middleware/proxy-auth.middleware";

process.env.REQUIRE_PROXY_AUTH = "true";
process.env.PROXY_SECRET = "super-secret-test-key";

console.log("Environment set:", process.env.REQUIRE_PROXY_AUTH);

const app = new Elysia()
  .onBeforeHandle(() => {
    console.log("Root app onBeforeHandle triggered");
  })
  .use(proxyAuthMiddleware)
  .get("/", () => {
    console.log("Handler reached!");
    return "Sensitive Backend Data";
  });

console.log("App initialized. Handling request...");

const req = new Request("http://localhost/");
const res = await app.handle(req);

console.log("Response status:", res.status);
const body = await res.text();
console.log("Response body:", body);
