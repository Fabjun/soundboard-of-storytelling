/**
 * @fileoverview nanoid — tiny URL-safe unique ID generator
 *
 * Not using the npm package to avoid an extra dep for a trivial utility.
 * 21-char alphanumeric IDs: 62^21, about 2^125 possible values (more than sufficient).
 * Uses crypto.getRandomValues (available in all target environments).
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 21;

/**
 * Returns a new random id of 21 letters and digits.
 *
 * @remarks `byte % 62` makes the first 8 characters of the alphabet slightly more likely (256 is
 * not a multiple of 62) — irrelevant for ids, which only have to be unique.
 */
export function nanoid(): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('');
}
