import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db";
import { generateAnonymousId } from "../utils/crypto.utils";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuthRoutes = new Elysia({ prefix: "/api/auth/google" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "secret" }))

  .post("/login", async ({ body, jwt }: any) => {
    const { idToken } = body;

    // Verify with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub, email } = ticket.getPayload()!;

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email },
      update: { auth_provider: "google", auth_provider_id: sub },
      create: {
        email,
        password: null,
        auth_provider: "google",
        auth_provider_id: sub,
        anonymous_identifier: generateAnonymousId(sub),
        role: "user"
      }
    });

    // Return JWT
    return {
      token: await jwt.sign({ userId: user.id, email: user.email, role: user.role }),
      user: { id: user.id, email: user.email, role: user.role }
    };
  });
