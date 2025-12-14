/**
 * Cryptography service for password hashing
 * Based on FEATURE_SPECS.md - FR-002
 */

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 * @returns Promise<string> - Hex-encoded SHA-256 hash (64 characters)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a password against a stored hash
 * @param password - Plain text password to verify
 * @param hash - Stored SHA-256 hash to compare against
 * @returns Promise<boolean> - True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}
