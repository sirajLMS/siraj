/**
 * Sanitize credential-bearing URLs by replacing passwords with ***.
 * E.g. "redis://user:secret123@host:6379" → "redis://user:***@host:6379"
 */
export function sanitizeUrlCredentials(url: string): string {
  return url.replace(/:([^@]+)@/, ":***@");
}
