import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AuthController } from "../controllers/auth.controller";

const controller = new AuthController();

export const authRoutes = new Elysia({ 
  prefix: "/api/auth",
  detail: {
    tags: ["Authentication"],
    description: "Authentication endpoints for OAuth login and token verification"
  }
})
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "secret" }))

  /**
   * POST /api/auth/login
   * Generic login endpoint for any provider
   */
  .post("/login", async ({ body, jwt, set }: any) => {
    return controller.handleProviderLogin(body, jwt, set);
  }, {
    body: t.Object({
      provider: t.String({ description: "OAuth provider (e.g., 'google')" }),
      token: t.String({ description: "ID token from the OAuth provider" })
    }),
    detail: {
      summary: "Login with OAuth Provider",
      description: "Authenticate using an OAuth provider's ID token. Supports Google and Haweya providers.",
      responses: {
        200: {
          description: "Successful authentication",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  token: { type: "string", description: "JWT access token" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      email: { type: "string" },
                      name: { type: "string" },
                      picture: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: "Invalid credentials or token" }
      }
    }
  })

  /**
   * POST /api/auth/google/callback
   * Exchange OAuth authorization code for tokens
   */
  .post("/google/callback", async ({ body, jwt, set }: any) => {
    return controller.handleGoogleCallback(body, jwt, set);
  }, {
    body: t.Object({
      code: t.String({ description: "OAuth authorization code from Google" }),
      redirect_uri: t.String({ description: "Redirect URI used in the OAuth flow" })
    }),
    detail: {
      summary: "Google OAuth Callback",
      description: "Exchange a Google OAuth authorization code for an access token and user info. Creates a new user if first login.",
      responses: {
        200: {
          description: "Successfully authenticated with Google",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  token: { type: "string" },
                  user: { type: "object" }
                }
              }
            }
          }
        },
        401: { description: "Invalid authorization code" }
      }
    }
  })

  /**
   * POST /api/auth/haweya/callback
   * Exchange Haweya OAuth authorization code for tokens
   */
  .post("/haweya/callback", async ({ body, jwt, set }: any) => {
    return controller.handleHaweyaCallback(body, jwt, set);
  }, {
    body: t.Object({
      code: t.String({ description: "OAuth authorization code from Haweya" }),
      redirect_uri: t.String({ description: "Redirect URI used in the OAuth flow" })
    }),
    detail: {
      summary: "Haweya OAuth Callback",
      description: "Exchange a Haweya National ID OAuth authorization code for an access token and verified user info.",
      responses: {
        200: {
          description: "Successfully authenticated with Haweya",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  token: { type: "string" },
                  user: { type: "object" }
                }
              }
            }
          }
        },
        401: { description: "Invalid authorization code" }
      }
    }
  })

  /**
   * GET /api/auth/verify
   * Verify JWT token and get user data
   */
  .get("/verify", async ({ jwt, set, headers }: any) => {
    return controller.verifyToken(jwt, set, headers);
  }, {
    headers: t.Object({
      authorization: t.Optional(t.String({ description: "Bearer token" }))
    }),
    detail: {
      summary: "Verify Token",
      description: "Verify a JWT token and return the associated user data. Used to check if a session is still valid.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Token is valid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  user: {
                    type: "object",
                    properties: {
                      userId: { type: "string" },
                      email: { type: "string" },
                      role: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: "Invalid or expired token" }
      }
    }
  });
