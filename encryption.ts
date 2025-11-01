import crypto from "crypto";

/**
 * AES-256-CBC encryption service for sensitive data (ID cards)
 */

const ALGORITHM = "aes-256-cbc";
const AES_KEY = process.env.AES_KEY || "default-32-char-key-for-dev-only!!";
const AES_IV = process.env.AES_IV || "default-16-char!";

// Ensure key and IV are correct lengths
const KEY = Buffer.from(AES_KEY.padEnd(32, "0").slice(0, 32));
const IV = Buffer.from(AES_IV.padEnd(16, "0").slice(0, 16));

/**
 * Encrypt ID card number
 */
export function encryptIdCard(idCard: string): string {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(idCard, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

/**
 * Decrypt ID card number
 */
export function decryptIdCard(encryptedIdCard: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  let decrypted = decipher.update(encryptedIdCard, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Get last 4 digits of ID card for display
 */
export function getIdCardLast4(idCard: string): string {
  return idCard.slice(-4);
}

/**
 * Mask ID card for display (show last 4 only)
 */
export function maskIdCard(idCard: string): string {
  if (idCard.length <= 4) return idCard;
  return "*".repeat(idCard.length - 4) + idCard.slice(-4);
}
