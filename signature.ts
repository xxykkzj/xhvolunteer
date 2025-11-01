import crypto from "crypto";

/**
 * HMAC-SHA256 signature service for redemption code verification
 */

const HMAC_SECRET = process.env.HMAC_SECRET || "default-hmac-secret-for-dev-only";

/**
 * Generate HMAC-SHA256 signature for redemption code
 * Format: order_id|user_id|exp_ts
 */
export function generateRedemptionSignature(
  orderId: number,
  userId: number,
  expiresAt: number = 0
): string {
  const payload = `${orderId}|${userId}|${expiresAt}`;
  const hmac = crypto.createHmac("sha256", HMAC_SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Verify redemption code signature
 */
export function verifyRedemptionSignature(
  orderId: number,
  userId: number,
  expiresAt: number,
  signature: string
): boolean {
  const expectedSignature = generateRedemptionSignature(orderId, userId, expiresAt);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Generate redemption code payload
 * Format: order_id|user_id|exp_ts|sig
 */
export function generateRedemptionCode(
  orderId: number,
  userId: number,
  expiresAt: Date | null = null
): { payload: string; signature: string; fullCode: string } {
  const expTs = expiresAt ? Math.floor(expiresAt.getTime() / 1000) : 0;
  const signature = generateRedemptionSignature(orderId, userId, expTs);
  const payload = `${orderId}|${userId}|${expTs}`;
  const fullCode = `${payload}|${signature}`;

  return {
    payload,
    signature,
    fullCode,
  };
}

/**
 * Parse and verify redemption code
 */
export function parseRedemptionCode(code: string): {
  valid: boolean;
  orderId?: number;
  userId?: number;
  expiresAt?: number;
  expired?: boolean;
} {
  try {
    const parts = code.split("|");
    if (parts.length !== 4) {
      return { valid: false };
    }

    const [orderIdStr, userIdStr, expTsStr, signature] = parts;
    const orderId = parseInt(orderIdStr, 10);
    const userId = parseInt(userIdStr, 10);
    const expiresAt = parseInt(expTsStr, 10);

    if (isNaN(orderId) || isNaN(userId) || isNaN(expiresAt)) {
      return { valid: false };
    }

    // Verify signature
    const isValid = verifyRedemptionSignature(orderId, userId, expiresAt, signature);
    if (!isValid) {
      return { valid: false };
    }

    // Check expiration (0 means no expiration)
    const expired = expiresAt > 0 && Date.now() / 1000 > expiresAt;

    return {
      valid: true,
      orderId,
      userId,
      expiresAt,
      expired,
    };
  } catch (error) {
    return { valid: false };
  }
}
