import { AuthService } from "../services/auth/auth.service";

export class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
  }

  /**
   * Generic login handler for any provider
   * Body: { provider: "google", token: "..." }
   */
  async handleProviderLogin(body: any, jwt: any, set: any) {
    try {
      const { provider, token } = body;

      if (!provider || !token) {
        set.status = 400;
        return {
          success: false,
          error: "Missing 'provider' or 'token' in request body",
        };
      }

      // Delegate to service
      const user = await this.authService.loginWithProvider(provider, token);

      // Generate JWT
      const jwtToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            anonymousIdentifier: user.anonymous_identifier,
            provider: user.auth_provider
          },
        },
      };
    } catch (error: any) {
      console.error(`[AuthController] ${body.provider} login error:`, error);
      set.status = 401;
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }
  }

  /**
   * Handle Google OAuth callback - exchange code for tokens
   * Body: { code: "...", redirect_uri: "..." }
   */
  async handleGoogleCallback(body: any, jwt: any, set: any) {
    try {
      const { code, redirect_uri } = body;

      if (!code) {
        set.status = 400;
        return {
          success: false,
          error: "Missing 'code' in request body",
        };
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        set.status = 500;
        return {
          success: false,
          error: "Google OAuth not configured on server",
        };
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirect_uri || "",
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenResponse.json() as {
        error?: string;
        error_description?: string;
        id_token?: string;
        access_token?: string;
      };

      if (tokenData.error) {
        console.error("[AuthController] Google token error:", tokenData);
        set.status = 401;
        return {
          success: false,
          error: tokenData.error_description || tokenData.error,
        };
      }

      // Use the id_token to authenticate
      const user = await this.authService.loginWithProvider("google", tokenData.id_token!);

      // Generate our JWT
      const jwtToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            anonymousIdentifier: user.anonymous_identifier,
            provider: user.auth_provider
          },
        },
      };
    } catch (error: any) {
      console.error("[AuthController] Google callback error:", error);
      set.status = 401;
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }
  }

  /**
   * Handle Haweya OAuth callback - exchange code for tokens
   * Body: { code: "...", redirect_uri: "..." }
   */
  async handleHaweyaCallback(body: any, jwt: any, set: any) {
    try {
      const { code, redirect_uri } = body;

      if (!code) {
        set.status = 400;
        return {
          success: false,
          error: "Missing 'code' in request body",
        };
      }

      const haweyaUrl = process.env.HAWEYA_ISSUER_URL || "http://localhost:3030";
      const clientId = process.env.HAWEYA_CLIENT_ID;
      const clientSecret = process.env.HAWEYA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        set.status = 500;
        return {
          success: false,
          error: "Haweya OAuth not configured on server",
        };
      }

      // Exchange code for tokens with Haweya server
      const tokenResponse = await fetch(`${haweyaUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirect_uri || "",
        }),
      });

      const tokenData = await tokenResponse.json() as {
        error?: string;
        error_description?: string;
        access_token?: string;
        id_token?: string;
      };

      if (tokenData.error) {
        console.error("[AuthController] Haweya token error:", tokenData);
        set.status = 401;
        return {
          success: false,
          error: tokenData.error_description || tokenData.error,
        };
      }

      // Use the access_token to authenticate with our haweya provider
      const user = await this.authService.loginWithProvider("haweya", tokenData.access_token!);

      // Generate our JWT
      const jwtToken = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            anonymousIdentifier: user.anonymous_identifier,
            provider: user.auth_provider
          },
        },
      };
    } catch (error: any) {
      console.error("[AuthController] Haweya callback error:", error);
      set.status = 401;
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }
  }

  async verifyToken(jwt: any, set: any, headers: any) {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return {
          success: false,
          error: "Missing or invalid authorization header",
        };
      }

      const token = authHeader.substring(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        set.status = 401;
        return {
          success: false,
          error: "Invalid token",
        };
      }

      // Get fresh user data
      const user = await this.authService.getUserById(payload.userId);

      if (!user) {
        set.status = 404;
        return {
          success: false,
          error: "User not found",
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            anonymousIdentifier: user.anonymous_identifier,
            provider: user.auth_provider
          },
        },
      };
    } catch (error: any) {
      console.error("[AuthController] Verify error:", error);
      set.status = 401;
      return {
        success: false,
        error: "Token verification failed",
      };
    }
  }
}

