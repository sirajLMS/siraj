export const SIDEBAR_COOKIE_NAME = "sidebar-open";

/**
 * Get initial sidebar state from cookie value (server-side compatible).
 * Returns `false` if cookie is explicitly `"false"`, otherwise `true` (default expanded).
 */
export function getSidebarStateFromCookies(cookieValue?: string): boolean {
  if (cookieValue === "false") {
    return false;
  }
  if (cookieValue === "true") {
    return true;
  }
  return true;
}

/**
 * Persist sidebar open/collapsed state to cookie on the client.
 */
export function setSidebarCookie(open: boolean) {
  if (typeof window !== "undefined") {
    const value = open ? "true" : "false";
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie setting for SSR sidebar state
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  }
}
