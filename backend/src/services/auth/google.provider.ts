import { OAuth2Client } from "google-auth-library";
import { IAuthProvider, AuthUser } from "../../interfaces/auth-provider.interface";

export class GoogleAuthProvider implements IAuthProvider {
  private client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }
    this.client = new OAuth2Client(clientId);
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Invalid token payload");
      }

      if (!payload.email) {
        throw new Error("Email not provided in token");
      }

      return {
        email: payload.email,
        providerId: payload.sub,
        name: payload.name,
        picture: payload.picture
      };
    } catch (error: any) {
      throw new Error(`Google verification failed: ${error.message}`);
    }
  }
}
