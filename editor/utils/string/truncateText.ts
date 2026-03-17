/**
 * Truncates text to a maximum length, adding ellipsis if truncated.
 * Trims whitespace before processing.
 *
 * @param value - The text to truncate
 * @param maxLength - Maximum length before truncation (default: 240)
 * @returns Truncated text with ellipsis if needed, or empty string if input is empty
 *
 * @example
 * truncateText("Hello world", 5) // "Hello..."
 * truncateText("Hi", 10) // "Hi"
 * truncateText("  spaced  ") // "spaced"
 */
export function truncateText(value: string, maxLength = 240): string {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
}
