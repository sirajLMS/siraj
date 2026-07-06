import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/shared/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const intlResponse = intlMiddleware(request);

  if (intlResponse.headers.get("location")) {
    intlResponse.headers.set("x-pathname", pathname);
    intlResponse.headers.set("x-nonce", nonce);
    return intlResponse;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  intlResponse.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  response.headers.set("x-pathname", pathname);
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - static files (images, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"], //NOSONAR
};
