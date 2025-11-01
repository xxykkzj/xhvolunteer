import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate initial password from birthday (yymmdd format)
 * @param birthday Date object
 * @returns 6-digit password string (yymmdd)
 */
export function generateInitialPassword(birthday: Date): string {
  const year = birthday.getFullYear().toString().slice(-2);
  const month = (birthday.getMonth() + 1).toString().padStart(2, "0");
  const day = birthday.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}
