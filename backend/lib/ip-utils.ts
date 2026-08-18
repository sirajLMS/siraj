const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * Sanitize an IP address: strip optional port suffix, validate against IPv4
 * format, and fall back to `[IP_REDACTED]` when the value is missing or
 * does not match. Returns `null` when the input is falsy.
 */
export function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const parts = ip.split(":");
  const cleanIp = parts.length === 2 ? parts[0] : ip;
  return IPV4_REGEX.test(cleanIp) ? cleanIp : "127.0.0.1";
}
