/**
 * Sanitize credential-bearing URLs by replacing passwords with ***.
 * E.g. "redis://user:secret123@host:6379" → "redis://user:***@host:6379"
 */
export function sanitizeUrlCredentials(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    // Not a valid URL — return as-is (won't contain structured credentials anyway)
    return url;
  }
}
