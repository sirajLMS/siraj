import { isIP } from "node:net";

/**
 * Sanitize an IP address: strip optional IPv4 port suffix, validate against IPv4
 * or IPv6 format, and fall back to `127.0.0.1` when the value is missing or
 * does not match. Returns `null` when the input is falsy.
 *
 * Uses Node's built-in `net.isIP()` for robust validation covering IPv4-mapped
 * IPv6, bracketed forms, zone IDs, and all other edge cases that a hand-rolled
 * regex would miss.
 */
export function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // Strip IPv4 port suffix (IPv4:port format)
  const parts = ip.split(":");
  const cleanIp = parts.length === 2 ? parts[0] : ip;
  if (isIP(cleanIp) === 4) return cleanIp;
  // IPv6 addresses contain multiple colons — validate and return as-is.
  // Also handle bracketed IPv6 forms like [::1] by stripping brackets.
  const unbracketed = cleanIp.startsWith("[") && cleanIp.endsWith("]") ? cleanIp.slice(1, -1) : cleanIp;
  if (isIP(unbracketed) === 6) return unbracketed;
  return "127.0.0.1";
}
