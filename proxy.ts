//cspell:ignore: NOSONAR
// Next.js 16 uses proxy.ts for request interception
// We're adapting next-intl's middleware pattern to the new proxy convention

import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/shared/i18n/routing";

// Create the next-intl middleware with localePrefix: 'never'
const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - static files (images, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"], //NOSONAR
};
