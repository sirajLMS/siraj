import { headers } from "next/headers";
import {
  buildLoginHref,
  DEFAULT_POST_LOGIN_PATH,
  isSafeRedirect,
  LOGIN_REDIRECT_PARAM,
} from "@/frontend/lib/safeRedirect";
import { redirect } from "@/shared/i18n/routing";

/**
 * Reads the current request path (+ search) from proxy-injected headers.
 * Falls back to the default post-login path when headers are missing.
 */
export async function getRequestReturnPath(): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");

  if (!pathname) {
    return DEFAULT_POST_LOGIN_PATH;
  }

  const search = headersList.get("x-search") ?? "";
  return `${pathname}${search}`;
}

/**
 * When an authenticated user hits an auth page, resolve where they should go.
 * Honors `?redirect=` on `/login`; otherwise defaults to the dashboard.
 */
export async function getAuthenticatedAuthBounceHref(): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");
  if (pathname !== "/login") {
    return DEFAULT_POST_LOGIN_PATH;
  }

  const search = headersList.get("x-search") ?? "";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return isSafeRedirect(params.get(LOGIN_REDIRECT_PARAM));
}

/**
 * Server redirect to login, preserving the current request path as `?redirect=`.
 */
export async function redirectToLogin(locale: string): Promise<never> {
  const returnPath = await getRequestReturnPath();
  return redirect({ href: buildLoginHref(returnPath), locale });
}
