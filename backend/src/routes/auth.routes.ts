import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AuthController } from "../controllers/auth.controller";

const controller = new AuthController();

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "secret" }))

  /**
   * POST /api/auth/login
   * Generic login endpoint for any provider
   * 
   * Body:
   * {
   *   "provider": "google",
   *   "token": "id-token-here"
   * }
   */
  .post("/login", async ({ body, jwt, set }: any) => {
    return controller.handleProviderLogin(body, jwt, set);
  })

  /**
   * POST /api/auth/google/callback
   * Exchange OAuth authorization code for tokens
   * 
   * Body:
   * {
   *   "code": "authorization-code",
   *   "redirect_uri": "http://localhost:3000/api/auth/google/callback"
   * }
   */
  .post("/google/callback", async ({ body, jwt, set }: any) => {
    return controller.handleGoogleCallback(body, jwt, set);
  })

  /**
   * POST /api/auth/haweya/callback
   * Exchange Haweya OAuth authorization code for tokens
   * 
   * Body:
   * {
   *   "code": "authorization-code",
   *   "redirect_uri": "http://localhost:3000/auth/haweya/callback"
   * }
   */
  .post("/haweya/callback", async ({ body, jwt, set }: any) => {
    return controller.handleHaweyaCallback(body, jwt, set);
  })

  /**
   * GET /api/auth/verify
   * Verify JWT token and get user data
   * 
   * Headers:
   * Authorization: Bearer <token>
   */
  .get("/verify", async ({ jwt, set, headers }: any) => {
    return controller.verifyToken(jwt, set, headers);
  });

