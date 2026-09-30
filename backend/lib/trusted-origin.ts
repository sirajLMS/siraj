import type { NextRequest } from "next/server";
import { getEnv, getEnvironmentConfig } from "@/backend/lib/env";

const envConfig = getEnvironmentConfig();
const isProduction = envConfig.nodeEnv === "production";

/**
 * Origins an absolute redirect may be built from. The `Host` family of request
 * headers is only honoured when the candidate host resolves to one of these or
 * to the request's own host — a client-supplied host must never pick the
 * redirect origin (host-header injection / open redirect).
 */
export const ALLOWED_ORIGINS = new Set(
  [
    getEnv("NEXT_PUBLIC_BASE_URL", ""),
    envConfig.allowedOrigin,
    // Local dev convenience only — must never be trusted in production.
    ...(isProduction ? [] : ["http://localhost:3000"]),
  ].filter((value): value is string => typeof value === "string" && value.length > 0)
);

function isHttpProtocol(value: string): value is "http" | "https" {
  return value === "http" || value === "https";
}

/**
 * Resolve the origin an absolute redirect should be built from, preferring
 * `X-Forwarded-Host` / `Host` over the request URL only when the candidate host
 * is trusted, and falling back to the request's own origin otherwise.
 */
export function resolveTrustedOrigin(request: NextRequest): string {
  const candidateHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!candidateHost) {
    return request.nextUrl.origin;
  }

  // A chain of proxies may append its own scheme; the first entry is the
  // client-facing one. Anything that is not http(s) is never trusted.
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto ? forwardedProto : request.nextUrl.protocol.replace(":", "");
  if (!isHttpProtocol(protocol)) {
    return request.nextUrl.origin;
  }

  let candidateUrl: URL;
  try {
    candidateUrl = new URL(`${protocol}://${candidateHost}`);
  } catch {
    // Malformed host header (spaces, invalid characters) — never interpolate it.
    return request.nextUrl.origin;
  }

  const isTrusted =
    candidateUrl.host === request.nextUrl.host ||
    candidateUrl.hostname === request.nextUrl.hostname ||
    ALLOWED_ORIGINS.has(candidateUrl.origin) ||
    ALLOWED_ORIGINS.has(candidateUrl.host);
  return isTrusted ? candidateUrl.origin : request.nextUrl.origin;
}
