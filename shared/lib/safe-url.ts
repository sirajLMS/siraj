/**
 * Validates a URL to prevent javascript: protocol injection and other unsafe schemes.
 * Rejects control characters, malformed URLs, and non-http(s) protocols.
 * Only allows valid http(s) URLs.
 */
export function isSafeUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  // Reject ASCII control characters (0x00-0x1F, 0x7F) anywhere — browsers
  // strip them during URL normalization, which can be leveraged to bypass
  // protocol and host checks.
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return "";
    }
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch {
    return "";
  }

  return "";
}
