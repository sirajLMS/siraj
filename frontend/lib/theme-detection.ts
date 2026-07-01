import type { PaletteMode } from "@mui/material/styles";

export const THEME_COOKIE_NAME = "theme-mode";

interface BrowserCookie {
  readonly value?: string;
}

interface BrowserCookieStore {
  readonly get: (name: string) => Promise<BrowserCookie | null>;
  readonly set: (options: {
    readonly name: string;
    readonly value: string;
    readonly expires: number;
    readonly path: string;
    readonly sameSite: "lax";
    readonly secure: true;
  }) => Promise<void>;
}

type BrowserGlobalScope = Omit<typeof globalThis, "cookieStore" | "window"> & {
  readonly cookieStore?: BrowserCookieStore;
  readonly window?: Window;
};

function getBrowserGlobalScope() {
  return globalThis as BrowserGlobalScope;
}

function hasClientWindow() {
  return getBrowserGlobalScope().window !== undefined;
}

export function getClientTheme(): PaletteMode {
  if (!hasClientWindow()) {
    return "dark";
  }
  const saved = globalThis.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return "dark";
}

export function setThemePreference(mode: PaletteMode) {
  if (hasClientWindow()) {
    globalThis.localStorage.setItem("theme", mode);
    // Also set as cookie so server can read it (fire and forget)
    setCookie(THEME_COOKIE_NAME, mode, 365).catch(() => {
      // Silently fail if cookie setting fails
    });
  }
}

/**
 * Set a cookie with the given name, value, and expiration days
 *
 * SECURITY NOTE: This cookie cannot use httpOnly=true because it is set from
 * client-side JavaScript (both Cookie Store API and document.cookie fallback).
 * The httpOnly flag prevents JavaScript access, which would break the cookieStore
 * reads in getCookie(). For a more secure alternative, consider setting the theme
 * cookie server-side via Next.js middleware or a Server Action with httpOnly:true,
 * and reading it only from the request headers on subsequent page loads.
 */
async function setCookie(name: string, value: string, days: number) {
  if (!hasClientWindow()) {
    return;
  }

  const expires = Date.now() + days * 24 * 60 * 60 * 1000;

  // Use Cookie Store API if available
  const cookieStore = getBrowserGlobalScope().cookieStore;
  if (cookieStore !== undefined) {
    try {
      await cookieStore.set({
        name,
        value,
        expires,
        path: "/",
        sameSite: "lax",
        secure: true,
      });
      return;
    } catch {
      // Fall through to legacy method if Cookie Store API fails
    }
  }

  // Fallback to traditional method for browsers without Cookie Store API
  const date = new Date(expires);
  const expiresStr = `expires=${date.toUTCString()}`;
  // biome-ignore lint/suspicious/noDocumentCookie: Fallback for browsers without Cookie Store API
  globalThis.document.cookie = `${name}=${value};${expiresStr};path=/;SameSite=Lax;Secure`;
}

/**
 * Get a cookie value by name (client-side)
 */
export async function getCookie(name: string): Promise<string | null> {
  if (!hasClientWindow()) {
    return null;
  }

  // Use Cookie Store API if available
  const cookieStore = getBrowserGlobalScope().cookieStore;
  if (cookieStore !== undefined) {
    try {
      const cookie = await cookieStore.get(name);
      return cookie?.value ?? null;
    } catch {
      // Fall through to legacy method if Cookie Store API fails
    }
  }

  // Fallback to traditional method for browsers without Cookie Store API
  const nameEQ = `${name}=`;
  const cookies = globalThis.document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trimStart();
    if (trimmedCookie.startsWith(nameEQ)) {
      return trimmedCookie.substring(nameEQ.length);
    }
  }
  return null;
}

/**
 * Get theme from cookie value (server-side compatible)
 */
export function getThemeFromCookies(themeValue?: string): PaletteMode {
  if (themeValue === "light" || themeValue === "dark") {
    return themeValue;
  }

  return "dark";
}
