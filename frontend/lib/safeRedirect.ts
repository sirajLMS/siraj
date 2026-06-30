const SAFE_URL_REGEX = /^https?:\/\//i;

/**
 * Validates a URL to prevent javascript: protocol injection and other unsafe schemes.
 * Only allows http(s) URLs.
 */
export function isSafeUrl(url: string): string {
  if (!url || !SAFE_URL_REGEX.test(url)) {
    return "";
  }
  return url;
}

/**
 * Validates a redirect URL to prevent open redirect attacks.
 *
 * Only allows relative paths starting with a single `/`.
 * Rejects absolute URLs (e.g., `https://evil.com`), protocol-relative
 * URLs (`//evil.com`), and backslash variants (`/\evil.com`).
 *
 * @param url - The redirect URL to validate (typically from a query parameter).
 * @returns The original URL if safe, otherwise the default redirect path.
 */
export function isSafeRedirect(url: string | null): string {
  if (!url) return "/dashboard";
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
    return url;
  }
  return "/dashboard";
}
