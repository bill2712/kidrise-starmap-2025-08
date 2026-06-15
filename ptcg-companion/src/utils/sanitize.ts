/**
 * Centralized sanitization utilities for preventing XSS vulnerabilities.
 */

/**
 * Escapes HTML special characters in a string to prevent XSS injection.
 * @param str The user-provided string to sanitize.
 * @returns The safely escaped string.
 */
export function escapeHTML(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
