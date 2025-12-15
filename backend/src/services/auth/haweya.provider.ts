import { IAuthProvider, AuthUser } from "../../interfaces/auth-provider.interface";

/**
 * Haweya (Egypt National ID) OAuth Provider
 * 
 * This provider handles authentication via the Haweya mock OAuth system.
 * It validates ID tokens issued by the Haweya server.
 * 
 * Required environment variables:
 * - HAWEYA_ISSUER_URL: The Haweya server URL (e.g., http://localhost:3030)
 * - HAWEYA_CLIENT_ID: Your registered client ID
 * - HAWEYA_CLIENT_SECRET: Your client secret
 */
export class HaweyaAuthProvider implements IAuthProvider {
  private issuerUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.issuerUrl = process.env.HAWEYA_ISSUER_URL || "http://localhost:3030";
    this.clientId = process.env.HAWEYA_CLIENT_ID || "sawtak_client";
    this.clientSecret = process.env.HAWEYA_CLIENT_SECRET || "sawtak_secret";

    if (!this.clientId || !this.clientSecret) {
      console.warn("[HaweyaAuthProvider] Missing HAWEYA_CLIENT_ID or HAWEYA_CLIENT_SECRET");
    }
  }

  /**
   * Verify a Haweya access token by calling the userinfo endpoint
   * This is different from Google where we verify an ID token.
   * With Haweya, the frontend sends us an access token after OAuth flow.
   */
  async verifyToken(accessToken: string): Promise<AuthUser> {
    try {
      // Call Haweya's userinfo endpoint to validate the token and get user info
      const response = await fetch(`${this.issuerUrl}/oauth/userinfo`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(error.error || "Token verification failed");
      }

      const userInfo = await response.json() as { email?: string; sub: string; name?: string; picture?: string };

      if (!userInfo.email) {
        throw new Error("Email not provided by Haweya");
      }

      return {
        email: userInfo.email,
        providerId: userInfo.sub, // Haweya user ID
        name: userInfo.name,
        picture: userInfo.picture || undefined,
      };
    } catch (error: any) {
      throw new Error(`Haweya verification failed: ${error.message}`);
    }
  }

  /**
   * Exchange an authorization code for tokens
   * Used when the frontend completes the OAuth flow and sends us the auth code
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    accessToken: string;
    idToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(`${this.issuerUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { error_description?: string; error?: string };
      throw new Error(error.error_description || error.error || "Token exchange failed");
    }

    const data = await response.json() as { access_token: string; id_token: string; expires_in: number };

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get the authorization URL for initiating the OAuth flow
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
    });

    if (state) {
      params.set("state", state);
    }

    return `${this.issuerUrl}/oauth/authorize?${params.toString()}`;
  }
}
