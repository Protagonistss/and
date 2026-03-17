/**
 * Returns the current timestamp in milliseconds.
 * A thin wrapper around Date.now() for easier testing and mocking.
 *
 * @returns Current timestamp in milliseconds
 *
 * @example
 * now() // 1710729600000
 */
export function now(): number {
  return Date.now();
}
