import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/shared/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-search", search);
  requestHeaders.set("x-nonce", nonce);

  const intlResponse = intlMiddleware(request);

  if (intlResponse.headers.get("location")) {
    intlResponse.headers.set("x-pathname", pathname);
    intlResponse.headers.set("x-search", search);
    intlResponse.headers.set("x-nonce", nonce);
    return intlResponse;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

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

  intlResponse.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
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
