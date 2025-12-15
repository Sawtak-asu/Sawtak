import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { nanoid } from "nanoid";
import { join } from "path";
import {
  findUserByEmail,
  findUserById,
  createUser,
  createAuthCode,
  getAuthCode,
  markAuthCodeUsed,
  getClient,
  validateClientCredentials,
  validateRedirectUri,
  createSession,
  getSession,
  deleteSession,
  seedDefaultClient,
  seedTestUser,
} from "./db";

const PORT = process.env.PORT || 3030;
const JWT_SECRET = process.env.JWT_SECRET || "haweya_dev_secret_change_in_production";

// Get the correct path to frontend directory
const frontendPath = join(import.meta.dir, "../../frontend");

// Initialize database and seed data
async function init() {
  await seedDefaultClient();
  await seedTestUser();
}

init().catch(console.error);

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
  }))
  .use(jwt({
    name: "jwt",
    secret: JWT_SECRET,
    exp: "1h",
  }))
  // Serve static files manually for Windows compatibility
  .get("/", () => Bun.file(join(frontendPath, "index.html")))
  .get("/index.html", () => Bun.file(join(frontendPath, "index.html")))
  .get("/login.html", () => Bun.file(join(frontendPath, "login.html")))
  .get("/signup.html", () => Bun.file(join(frontendPath, "signup.html")))
  .get("/css/style.css", () => Bun.file(join(frontendPath, "css/style.css")))
  // Health check
  .get("/health", () => ({ status: "ok", service: "haweya-mock-oauth" }))
  
  // ============ OAuth 2.0 Endpoints ============
  
  // Authorization endpoint - starts the OAuth flow
  .get("/oauth/authorize", async ({ query, cookie }) => {
    const { client_id, redirect_uri, response_type, scope, state } = query;
    
    // Validate required parameters
    if (!client_id || !redirect_uri || response_type !== "code") {
      return new Response(JSON.stringify({ error: "invalid_request", error_description: "Missing or invalid parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Validate client
    const client = await getClient(client_id);
    if (!client) {
      return new Response(JSON.stringify({ error: "invalid_client", error_description: "Unknown client_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Validate redirect URI
    if (!(await validateRedirectUri(client_id, redirect_uri))) {
      return new Response(JSON.stringify({ error: "invalid_redirect_uri", error_description: "Redirect URI not allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Check if user is already logged in
    const sessionId = cookie.haweya_session?.value;
    const userId = sessionId ? await getSession(sessionId) : null;
    
    if (userId) {
      // User is logged in, generate auth code and redirect
      const code = nanoid(32);
      await createAuthCode({
        code,
        userId,
        clientId: client_id,
        redirectUri: redirect_uri,
        scope: scope || "openid profile email",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set("code", code);
      if (state) redirectUrl.searchParams.set("state", state);
      
      return Response.redirect(redirectUrl.toString(), 302);
    }
    
    // Not logged in, redirect to login page with OAuth params
    const loginUrl = `http://localhost:3030/login.html?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope || "")}&state=${encodeURIComponent(state || "")}`;
    return Response.redirect(loginUrl, 302);
  }, {
    query: t.Object({
      client_id: t.String(),
      redirect_uri: t.String(),
      response_type: t.String(),
      scope: t.Optional(t.String()),
      state: t.Optional(t.String()),
    })
  })
  
  // Token endpoint - exchange auth code for tokens
  .post("/oauth/token", async ({ body, jwt, set }: any) => {
    const { grant_type, code, client_id, client_secret, redirect_uri } = body;
    
    if (grant_type !== "authorization_code") {
      set.status = 400;
      return { error: "unsupported_grant_type" };
    }
    
    // Validate client credentials
    if (!(await validateClientCredentials(client_id, client_secret))) {
      set.status = 401;
      return { error: "invalid_client" };
    }
    
    // Validate auth code
    const authCode = await getAuthCode(code);
    if (!authCode) {
      set.status = 400;
      return { error: "invalid_grant", error_description: "Invalid authorization code" };
    }
    
    if (authCode.used) {
      set.status = 400;
      return { error: "invalid_grant", error_description: "Authorization code already used" };
    }
    
    if (authCode.expiresAt < new Date()) {
      set.status = 400;
      return { error: "invalid_grant", error_description: "Authorization code expired" };
    }
    
    if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
      set.status = 400;
      return { error: "invalid_grant", error_description: "Client or redirect URI mismatch" };
    }
    
    // Mark code as used
    await markAuthCodeUsed(code);
    
    // Get user
    const user = await findUserById(authCode.userId);
    if (!user) {
      set.status = 400;
      return { error: "invalid_grant", error_description: "User not found" };
    }
    
    // Generate tokens
    const accessToken = await jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: "access_token",
    });
    
    const idToken = await jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture || null,
      national_id: user.nationalId,
      iss: `http://localhost:${PORT}`,
      aud: client_id,
      type: "id_token",
    });
    
    return {
      access_token: accessToken,
      id_token: idToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: authCode.scope,
    };
  }, {
    body: t.Object({
      grant_type: t.String(),
      code: t.String(),
      client_id: t.String(),
      client_secret: t.String(),
      redirect_uri: t.String(),
    })
  })
  
  // UserInfo endpoint - get authenticated user's info
  .get("/oauth/userinfo", async ({ headers, jwt, set }: any) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "invalid_token" };
    }
    
    const token = authHeader.slice(7);
    const payload = await jwt.verify(token);
    
    if (!payload || payload.type !== "access_token") {
      set.status = 401;
      return { error: "invalid_token" };
    }
    
    const user = await findUserById(payload.sub as string);
    if (!user) {
      set.status = 401;
      return { error: "invalid_token" };
    }
    
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture || null,
      national_id: user.nationalId,
    };
  })
  
  // ============ User Authentication Endpoints ============
  
  // Signup
  .post("/api/signup", async ({ body, set, cookie }: any) => {
    const { email, password, name, nationalId } = body;
    
    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      set.status = 409;
      return { error: "Email already registered" };
    }
    
    // Validate national ID format (14 digits for Egyptian ID)
    if (!/^\d{14}$/.test(nationalId)) {
      set.status = 400;
      return { error: "Invalid national ID format. Must be 14 digits." };
    }
    
    // Create user
    const user = await createUser({
      email,
      password, // In production, hash this!
      name,
      nationalId,
    });
    
    // Create session
    const sessionId = nanoid(32);
    await createSession(sessionId, user.id);
    
    cookie.haweya_session.set({
      value: sessionId,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      name: t.String(),
      nationalId: t.String(),
    })
  })
  
  // Login
  .post("/api/login", async ({ body, set, cookie }: any) => {
    const { email, password } = body;
    
    const user = await findUserByEmail(email);
    if (!user || user.password !== password) {
      set.status = 401;
      return { error: "Invalid email or password" };
    }
    
    // Create session
    const sessionId = nanoid(32);
    await createSession(sessionId, user.id);
    
    cookie.haweya_session.set({
      value: sessionId,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    })
  })
  
  // Logout
  .post("/api/logout", async ({ cookie }: any) => {
    const sessionId = cookie.haweya_session?.value;
    if (sessionId) {
      await deleteSession(sessionId);
      cookie.haweya_session.remove();
    }
    return { success: true };
  })
  
  // Get current user
  .get("/api/me", async ({ cookie, set }: any) => {
    const sessionId = cookie.haweya_session?.value;
    if (!sessionId) {
      set.status = 401;
      return { error: "Not authenticated" };
    }
    
    const userId = await getSession(sessionId);
    if (!userId) {
      set.status = 401;
      return { error: "Session expired" };
    }
    
    const user = await findUserById(userId);
    if (!user) {
      set.status = 401;
      return { error: "User not found" };
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  })
  
  // OAuth consent/authorize action (after login)
  .post("/api/authorize", async ({ body, cookie, set }: any) => {
    const { client_id, redirect_uri, scope, state } = body;
    
    const sessionId = cookie.haweya_session?.value;
    if (!sessionId) {
      set.status = 401;
      return { error: "Not authenticated" };
    }
    
    const userId = await getSession(sessionId);
    if (!userId) {
      set.status = 401;
      return { error: "Session expired" };
    }
    
    // Validate client
    const client = await getClient(client_id);
    if (!client) {
      set.status = 400;
      return { error: "Invalid client" };
    }
    
    // Generate auth code
    const code = nanoid(32);
    await createAuthCode({
      code,
      userId,
      clientId: client_id,
      redirectUri: redirect_uri,
      scope: scope || "openid profile email",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);
    
    return {
      redirect_to: redirectUrl.toString(),
    };
  }, {
    body: t.Object({
      client_id: t.String(),
      redirect_uri: t.String(),
      scope: t.Optional(t.String()),
      state: t.Optional(t.String()),
    })
  })
  
  .listen(PORT);

console.log(`🆔 Haweya Mock OAuth Server running at http://localhost:${PORT}`);
console.log(`   - OAuth Authorize: http://localhost:${PORT}/oauth/authorize`);
console.log(`   - OAuth Token: http://localhost:${PORT}/oauth/token`);
console.log(`   - UserInfo: http://localhost:${PORT}/oauth/userinfo`);
console.log(`   - Login Page: http://localhost:${PORT}/login.html`);
console.log(`   - Signup Page: http://localhost:${PORT}/signup.html`);
