import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Authentication middleware
 * Verifies JWT tokens regardless of how they were obtained
 * (Google OAuth, GitHub OAuth, email/password, etc.)
 * 
 * Usage:
 * .use(authMiddleware)
 * .get("/protected", ({ user }) => {
 *   // user contains: { userId, email, role }
 * })
 */
export const authMiddleware = new Elysia()
  .use(jwt({ name: "jwt", secret: JWT_SECRET }))
  .derive(async ({ headers, jwt, set }: any) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return {
        user: null,
        error: { success: false, error: "Unauthorized: No token provided" }
      };
    }

    const token = authHeader.substring(7);

    try {
      const payload = await jwt.verify(token);

      if (!payload) {
        set.status = 401;
        return {
          user: null,
          error: { success: false, error: "Unauthorized: Invalid token" }
        };
      }

      // Return user data from JWT payload
      return {
        user: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        },
        error: null
      };
    } catch (err) {
      set.status = 401;
      return {
        user: null,
        error: { success: false, error: "Unauthorized: Invalid token" }
      };
    }
  })
  .onBeforeHandle(({ user, error, set }: any) => {
    // If no user and there's an error, block the request
    if (!user && error) {
      set.status = 401;
      return error;
    }
  });
