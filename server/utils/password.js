// Password hashing helpers (scrypt), shared by the seed and the login check.
//
// We never store the plaintext password. For each user we store a random `salt`
// and the scrypt `hash` of (password + salt). On login we re-hash the attempt
// with the stored salt and compare in constant time.

import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 32; // bytes

// Hash a password. If no salt is given, a fresh random one is generated (seed use).
export async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return { salt, hash: derived.toString("hex") };
}

// Verify an attempt against a stored salt+hash. Constant-time comparison avoids
// timing attacks. Returns true/false.
export async function verifyPassword(password, salt, expectedHashHex) {
  const derived = await scrypt(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHashHex, "hex");
  // timingSafeEqual throws if lengths differ, so guard first.
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}
