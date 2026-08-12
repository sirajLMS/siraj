export const LOGIN_REDIRECT_PARAM = "redirect";
export const DEFAULT_POST_LOGIN_PATH = "/dashboard";
const LOGIN_PATH = "/login";

/**
 * Returns true when `url` is a same-origin relative path (single leading `/`).
 */
export function isRelativeSafePath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\");
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
  if (!url) return DEFAULT_POST_LOGIN_PATH;
  if (isRelativeSafePath(url)) {
    return url;
  }
  return DEFAULT_POST_LOGIN_PATH;
}

function isLoginPath(path: string): boolean {
  const pathname = path.split("?")[0] ?? path;
  return pathname === LOGIN_PATH || pathname.endsWith(LOGIN_PATH);
}

/**
 * Build `/login?redirect=...` from a relative return path (pathname + search).
 * Unsafe or login paths yield bare `/login` (no nested redirect param).
 */
export function buildLoginHref(returnPath: string): string {
  if (!isRelativeSafePath(returnPath) || isLoginPath(returnPath)) {
    return LOGIN_PATH;
  }
  return `${LOGIN_PATH}?${LOGIN_REDIRECT_PARAM}=${encodeURIComponent(returnPath)}`;
}

/**
 * Client: build login href from the current window location (pathname + search).
 */
export function buildLoginHrefFromWindow(): string {
  if (typeof globalThis.window === "undefined") {
    return LOGIN_PATH;
  }
  const { pathname, search } = globalThis.window.location;
  return buildLoginHref(`${pathname}${search}`);
}
