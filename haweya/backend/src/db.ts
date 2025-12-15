/**
 * Haweya Database Layer using Prisma
 * Connected to the same PostgreSQL as Sawtak with haweya_ prefixed tables
 */

import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
export const prisma = new PrismaClient();

// Types for backward compatibility
export interface HaweyaUser {
  id: string;
  email: string;
  password: string;
  name: string;
  nationalId: string;
  picture?: string | null;
  createdAt: Date;
}

export interface AuthCode {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  expiresAt: Date;
  used: boolean;
}

export interface OAuthClient {
  clientId: string;
  clientSecret: string;
  name: string;
  redirectUris: string[];
}

// User operations
export async function findUserByEmail(email: string): Promise<HaweyaUser | null> {
  const user = await prisma.haweyaUser.findUnique({ where: { email } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    name: user.name,
    nationalId: user.national_id,
    picture: user.picture,
    createdAt: user.created_at,
  };
}

export async function findUserById(id: string): Promise<HaweyaUser | null> {
  const user = await prisma.haweyaUser.findUnique({ where: { id } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    name: user.name,
    nationalId: user.national_id,
    picture: user.picture,
    createdAt: user.created_at,
  };
}

export async function findUserByNationalId(nationalId: string): Promise<HaweyaUser | null> {
  const user = await prisma.haweyaUser.findUnique({ where: { national_id: nationalId } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    name: user.name,
    nationalId: user.national_id,
    picture: user.picture,
    createdAt: user.created_at,
  };
}

export async function createUser(userData: { email: string; password: string; name: string; nationalId: string; picture?: string }): Promise<HaweyaUser> {
  const user = await prisma.haweyaUser.create({
    data: {
      email: userData.email,
      password: userData.password, // In production, hash this!
      name: userData.name,
      national_id: userData.nationalId,
      picture: userData.picture,
    },
  });
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    name: user.name,
    nationalId: user.national_id,
    picture: user.picture,
    createdAt: user.created_at,
  };
}

// Auth code operations
export async function createAuthCode(data: Omit<AuthCode, "used">): Promise<AuthCode> {
  const authCode = await prisma.haweyaAuthCode.create({
    data: {
      code: data.code,
      user_id: data.userId,
      client_id: data.clientId,
      redirect_uri: data.redirectUri,
      scope: data.scope,
      expires_at: data.expiresAt,
    },
  });
  return {
    code: authCode.code,
    userId: authCode.user_id,
    clientId: authCode.client_id,
    redirectUri: authCode.redirect_uri,
    scope: authCode.scope,
    expiresAt: authCode.expires_at,
    used: authCode.used,
  };
}

export async function getAuthCode(code: string): Promise<AuthCode | null> {
  const authCode = await prisma.haweyaAuthCode.findUnique({ where: { code } });
  if (!authCode) return null;
  return {
    code: authCode.code,
    userId: authCode.user_id,
    clientId: authCode.client_id,
    redirectUri: authCode.redirect_uri,
    scope: authCode.scope,
    expiresAt: authCode.expires_at,
    used: authCode.used,
  };
}

export async function markAuthCodeUsed(code: string): Promise<void> {
  await prisma.haweyaAuthCode.update({
    where: { code },
    data: { used: true },
  });
}

// Session operations
export async function createSession(sessionId: string, userId: string): Promise<void> {
  await prisma.haweyaSession.create({
    data: {
      id: sessionId,
      user_id: userId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
}

export async function getSession(sessionId: string): Promise<string | null> {
  const session = await prisma.haweyaSession.findUnique({ where: { id: sessionId } });
  if (!session || session.expires_at < new Date()) {
    return null;
  }
  return session.user_id;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.haweyaSession.deleteMany({ where: { id: sessionId } });
}

// Client operations
export async function getClient(clientId: string): Promise<OAuthClient | null> {
  const client = await prisma.haweyaClient.findUnique({ where: { client_id: clientId } });
  if (!client) return null;
  return {
    clientId: client.client_id,
    clientSecret: client.client_secret,
    name: client.name,
    redirectUris: client.redirect_uris,
  };
}

export async function validateClientCredentials(clientId: string, clientSecret: string): Promise<boolean> {
  const client = await prisma.haweyaClient.findUnique({ where: { client_id: clientId } });
  return client?.client_secret === clientSecret;
}

export async function validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
  const client = await prisma.haweyaClient.findUnique({ where: { client_id: clientId } });
  return client?.redirect_uris.includes(redirectUri) ?? false;
}

// Seed default client if not exists
export async function seedDefaultClient(): Promise<void> {
  const existing = await prisma.haweyaClient.findUnique({ where: { client_id: "sawtak_client" } });
  if (!existing) {
    await prisma.haweyaClient.create({
      data: {
        client_id: "sawtak_client",
        client_secret: "sawtak_secret",
        name: "Sawtak Platform",
        redirect_uris: [
          "http://localhost:3000/auth/haweya/callback",
          "http://localhost:8000/api/auth/haweya/callback",
        ],
      },
    });
    console.log("✅ Seeded default Haweya OAuth client: sawtak_client");
  }
}

// Seed a test user if none exist
export async function seedTestUser(): Promise<void> {
  const count = await prisma.haweyaUser.count();
  if (count === 0) {
    await prisma.haweyaUser.create({
      data: {
        email: "ahmed@test.com",
        password: "password123", // In production, hash this!
        name: "أحمد محمد",
        national_id: "30001011234567",
      },
    });
    console.log("✅ Seeded test user: ahmed@test.com / password123");
  }
}
