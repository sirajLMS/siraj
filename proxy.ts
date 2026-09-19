import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
// import { logger } from "@/backend/lib";
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";

const localeSet = new Set<string>(locales);

function isAppLocale(value: string): value is AppLocale {
  return localeSet.has(value);
}

function resolveLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isAppLocale(cookieLocale)) {
    return cookieLocale;
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

  // logger.log(`[proxy.ts] URL: ${request.url}`);
  // logger.log(`[proxy.ts] Cookie header in request.headers: ${request.headers.get("cookie")}`);
  // logger.log(`[proxy.ts] Cookie header in cloned requestHeaders: ${requestHeaders.get("cookie")}`);
  // logger.log(`[proxy.ts] request.cookies session_id: ${request.cookies.get("session_id")?.value}`);

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
  const devScriptSrc = isDev ? " https://va.vercel-scripts.com" : "";
  const devConnectSrc = isDev ? " https://vitals.vercel-insights.com" : "";
  // Facebook Embedded Signup (WhatsApp coexistence): the FB SDK script is loaded
  // from connect.facebook.net and then talks to graph/web endpoints; without these
  // hosts the ES dialog can never launch (scripts and SDK XHRs get CSP-blocked).
  const fbScriptSrc = " https://connect.facebook.net";
  const fbConnectSrc = " https://graph.facebook.com https://www.facebook.com https://web.facebook.com";
  const fbFrameSrc = " https://www.facebook.com https://web.facebook.com";
  const devImgSrc = isDev ? " http://localhost http://127.0.0.1 https://localhost https://127.0.0.1" : "";
  const cspValue =
    `default-src 'self'; ` +
    `script-src 'self' 'nonce-${nonce}' https://vercel.live${devScriptSrc}${fbScriptSrc}` +
    (isDev ? " 'unsafe-eval' 'unsafe-inline'" : "") +
    `; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
    `font-src 'self' https://fonts.gstatic.com; ` +
    `img-src 'self' data: blob: https://images.unsplash.com https://flagcdn.com https://*.blob.vercel-storage.com${devImgSrc}; ` +
    `connect-src 'self' https://*.nr-data.net https://*.newrelic.com https://*.upstash.com https://vercel.live https://*.blob.vercel-storage.com${devConnectSrc}${fbConnectSrc}; ` +
    `frame-src 'self'${fbFrameSrc}; ` +
    `frame-ancestors 'none';` +
    // harden CSP — block plugins/object, restrict base + form targets to self.
    ` object-src 'none'; base-uri 'self'; form-action 'self';`;

  response.headers.set("x-pathname", pathname);
  response.headers.set("x-search", search);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", cspValue);

  // transport + sniffing + referrer hardening, only in production where the
  // deployment is served over HTTPS behind a real edge (avoid breaking local
  // dev where HSTS would lock the browser into https://localhost).
  if (process.env.NODE_ENV === "production") {
    // Aligned with next.config.ts HSTS (2 years, preload).
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - static files (images, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"], //NOSONAR
};
