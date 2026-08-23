import "server-only";
import crypto from "node:crypto";

/**
 * Password hashing for the single admin credential (docs/COMMAND_CENTER.md).
 * Node's built-in `crypto.scrypt` — no new dependency for one password
 * check, and scrypt is a memory-hard KDF (deliberately slow against
 * brute force), same category as bcrypt/argon2. Stored format:
 * `scrypt:<saltHex>:<hashHex>` — self-describing so a future algorithm
 * change doesn't break already-issued hashes silently.
 */
const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/** Constant-time verification against a stored `scrypt:salt:hash` value. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== SCRYPT_KEY_LENGTH) return false;

  const actual = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return crypto.timingSafeEqual(actual, expected);
}
