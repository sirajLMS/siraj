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

/**
 * Detect the actual current app color scheme directly from the DOM document element (`<html>`).
 * Checks `data-mui-color-scheme`, `data-theme`, boolean attributes `data-dark`/`data-light`,
 * and `style.colorScheme` to determine whether the user is currently viewing dark or light mode.
 */
export function detectDocumentColorScheme(): PaletteMode | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const root = document.documentElement;
  const datasetScheme = root.dataset.muiColorScheme ?? root.dataset.theme;
  if (datasetScheme === "dark" || datasetScheme === "light") {
    return datasetScheme;
  }
  if (root.hasAttribute("data-dark")) {
    return "dark";
  }
  if (root.hasAttribute("data-light")) {
    return "light";
  }
  if (root.style.colorScheme === "dark" || root.style.colorScheme === "light") {
    return root.style.colorScheme as PaletteMode;
  }
  return undefined;
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
 * The httpOnly flag prevents JavaScript access. For a more secure alternative,
 * consider setting the theme cookie server-side via Next.js middleware or a
 * Server Action with httpOnly:true, and reading it only from the request
 * headers on subsequent page loads.
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
