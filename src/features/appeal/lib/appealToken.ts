import { env } from "@/env/server";
import crypto from "crypto";

const SECRET_KEY = env.APPEAL_TOKEN_SECRET;
const ALGORITHM = "aes-256-cbc";

// Ensure the key is exactly 32 bytes for AES-256
const getKey = (): Buffer => {
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();
  return key; // Returns 32 bytes
};

export const generateAppealToken = (email: string): string => {
  const payload = {
    email,
    timestamp: Date.now(),
    // Add expiry if needed (e.g., 7 days)
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  const key = getKey();
  const iv = crypto.randomBytes(16); // Initialization vector

  // Encrypt the payload for security
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
  encrypted += cipher.final("hex");

  // Combine IV and encrypted data (IV is needed for decryption)
  const combined = iv.toString("hex") + ":" + encrypted;

  // Return as base64 for URL safety
  return Buffer.from(combined).toString("base64");
};

export const decodeAppealToken = (
  token: string
): { email: string; expiresAt: number } | null => {
  try {
    // Decode from base64
    const combined = Buffer.from(token, "base64").toString("utf8");
    const [ivHex, encryptedHex] = combined.split(":");

    if (!ivHex || !encryptedHex) {
      return null;
    }

    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const payload = JSON.parse(decrypted);

    // Check if token is expired
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};
