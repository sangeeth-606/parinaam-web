import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Single source of truth for password hashing on the web dashboard.
 *
 * The scrypt parameters MUST match parinaam-app's server-side verifier
 * (`server/src/…`), because the same `officers` table is shared by both.
 * Centralising them here means the login route and any future credential
 * enrolment path can never drift apart.
 */
export const SCRYPT_PARAMS = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
} as const;

const scryptAsync = promisify(scrypt) as (
  password: Buffer,
  salt: Buffer,
  keylen: number,
  options: typeof SCRYPT_PARAMS
) => Promise<Buffer>;

/** Hash a password with a fresh random salt (hex-encoded output). */
export async function hashPassword(password: string): Promise<{
  saltHex: string;
  hashHex: string;
}> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(
    Buffer.from(password, "utf8"),
    salt,
    32,
    SCRYPT_PARAMS
  );
  return { saltHex: salt.toString("hex"), hashHex: derived.toString("hex") };
}

/**
 * Verify a candidate password against a stored scrypt hash in constant time.
 * Returns false (never throws) on any malformed input.
 */
export async function verifyScryptPassword(
  password: string,
  saltHex: string,
  expectedHashHex: string
): Promise<boolean> {
  if (!saltHex || !expectedHashHex) return false;
  try {
    const derived = await scryptAsync(
      Buffer.from(password, "utf8"),
      Buffer.from(saltHex, "hex"),
      32,
      SCRYPT_PARAMS
    );
    const expected = Buffer.from(expectedHashHex, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}