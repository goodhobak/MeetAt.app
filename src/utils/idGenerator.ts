/**
 * Generate a unique 8-character event ID
 * Based on FEATURE_SPECS.md - FR-001
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;

/**
 * Generate a random 8-character alphanumeric ID
 */
export function generateEventId(): string {
  let id = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    id += CHARS[randomIndex];
  }
  return id;
}

/**
 * Check if an ID already exists in LocalStorage
 */
export function eventIdExists(id: string): boolean {
  return localStorage.getItem(`event:${id}`) !== null;
}

/**
 * Generate a unique event ID that doesn't exist in LocalStorage
 * Recursively retries if collision detected (very rare)
 */
export function generateUniqueEventId(): string {
  const id = generateEventId();
  if (eventIdExists(id)) {
    return generateUniqueEventId(); // Retry on collision
  }
  return id;
}
