import { isIP } from "node:net";

const BRACKETED_IPV6 = /^\[([^\]]+)\](?::\d+)?$/;
const IPV4_WITH_PORT = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/;

/**
 * Sanitize an IP address for use as a rate-limit identifier: validate against
 * IPv4 or IPv6 format and strip bracket or port decoration, falling back to
 * `127.0.0.1` when the value is missing or unparseable. Returns `null` when
 * the input is falsy.
 *
 * Order matters: full IPv6 must be validated before any `:` handling, since
 * IPv6 addresses are colon-delimited and a naive split collapses distinct
 * addresses into a single shared bucket. Uses Node's built-in `net.isIP()`
 * for validation covering IPv4-mapped IPv6 and all other edge cases.
 */
export function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;

  const bracketed = BRACKETED_IPV6.exec(ip);
  if (bracketed && isIP(bracketed[1]) === 6) return bracketed[1];

  if (isIP(ip) === 6) return ip;

  const withPort = IPV4_WITH_PORT.exec(ip);
  if (withPort && isIP(withPort[1]) === 4) return withPort[1];

  if (isIP(ip) === 4) return ip;

  return "127.0.0.1";
}
