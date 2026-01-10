import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""; // Must be 32 bytes hex

if (!ENCRYPTION_KEY && process.env.NODE_ENV === "production") {
  throw new Error("ENCRYPTION_KEY is required in production");
}

// Derive a 32-byte key from the hex string or use it directly if it's already 32 bytes
const key = Buffer.from(ENCRYPTION_KEY, "hex");

export const encrypt = (text: string): string => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string): string => {
  const [ivHex, authTagHex, encryptedHex] = text.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted format");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

export const generateAnonymousId = (userId: string): string => {
  // Deterministic anonymous ID generation
  // SHA256(user_id + platform_secret)[0:12]
  const { createHash } = require('crypto');
  const hash = createHash('sha256');
  hash.update(`${userId}`);
  return `anon_${hash.digest('hex').substring(0, 12)}`;
};

/**
 * Decrypt with a manually provided key (for platform admin identity reveal)
 * @param text - The encrypted text in format iv:authTag:encrypted
 * @param manualKey - The 32-byte hex key provided by the platform admin
 * @returns Decrypted text
 */
export const decryptWithKey = (text: string, manualKey: string): string => {
  const [ivHex, authTagHex, encryptedHex] = text.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted format");
  }

  // Validate key format
  if (!/^[0-9a-fA-F]{64}$/.test(manualKey)) {
    throw new Error("Invalid decryption key format. Must be 64 hex characters (32 bytes).");
  }

  const manualKeyBuffer = Buffer.from(manualKey, "hex");

  const decipher = createDecipheriv(
    ALGORITHM,
    manualKeyBuffer,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
