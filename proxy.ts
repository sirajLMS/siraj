import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/backend/lib";
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";

function resolveLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as AppLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("ar")) return "ar";
    if (acceptLanguage.includes("en")) return "en";
  }

  return defaultLocale;
}

export default function proxy(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const requestHeaders = new Headers(request.headers);
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader);
  }
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-search", search);
  requestHeaders.set("x-nonce", nonce);

  logger.log(`[proxy.ts] URL: ${request.url}`);
  logger.log(`[proxy.ts] Cookie header in request.headers: ${request.headers.get("cookie")}`);
  logger.log(`[proxy.ts] Cookie header in cloned requestHeaders: ${requestHeaders.get("cookie")}`);
  logger.log(`[proxy.ts] request.cookies session_id: ${request.cookies.get("session_id")?.value}`);

  const locale = resolveLocale(request);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!request.cookies.get("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
  }

  const isDev = process.env.NODE_ENV === "development";
  const cspValue =
    `default-src 'self'; ` +
    `script-src 'self' 'nonce-${nonce}' https://vercel.live` +
    (isDev ? " 'unsafe-eval' 'unsafe-inline'" : "") +
    `; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
    `font-src 'self' https://fonts.gstatic.com; ` +
    `img-src 'self' data: blob: https://images.unsplash.com https://flagcdn.com https://*.blob.vercel-storage.com http://localhost http://127.0.0.1 https://localhost https://127.0.0.1; ` +
    `connect-src 'self' https://*.upstash.com https://vercel.live https://*.blob.vercel-storage.com; ` +
    `frame-ancestors 'none';`;

  response.headers.set("x-pathname", pathname);
  response.headers.set("x-search", search);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", cspValue);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - static files (images, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"], //NOSONAR
};
