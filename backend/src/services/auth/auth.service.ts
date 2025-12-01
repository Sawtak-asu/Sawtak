import { prisma } from "../../db";
import { generateAnonymousId } from "../../utils/crypto.utils";
import { IAuthProvider } from "../../interfaces/auth-provider.interface";
import { GoogleAuthProvider } from "./google.provider";

export type AuthProviderType = "google" | "github" | "apple"; // future : heweya

export class AuthService {
  private providers: Record<string, IAuthProvider>;

  constructor() {
    // Register providers here
    this.providers = {
      google: new GoogleAuthProvider(),
      // github: new GithubAuthProvider(),
    };
  }

  /**
   * Main entry point for login with any provider
   */
  async loginWithProvider(providerName: string, token: string) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Provider '${providerName}' is not supported`);
    }

    // 1. Verify token with the specific provider
    const authUser = await provider.verifyToken(token);

    // 2. Find or create user in database (Generic logic)
    const user = await prisma.user.upsert({
      where: { email: authUser.email },
      update: {
        auth_provider: providerName,
        auth_provider_id: authUser.providerId,
      },
      create: {
        email: authUser.email,
        password: null, // OAuth users don't have passwords
        auth_provider: providerName,
        auth_provider_id: authUser.providerId,
        anonymous_identifier: generateAnonymousId(authUser.providerId),
        role: "user",
      },
    });

    return user;
  }

  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        anonymous_identifier: true,
        auth_provider: true,
      },
    });
  }
}
