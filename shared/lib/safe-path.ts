/**
 * Returns true when `url` is a same-origin relative path (single leading `/`).
 * Rejects double-slashes (`//`), backslashes (`/\`), control characters, and
 * leading whitespace/control chars that browsers normalize into host separators.
 */
export function isRelativeSafePath(url: string): boolean {
  if (!url.startsWith("/")) {
    return false;
  }
  if (url.startsWith("//") || url.startsWith("/\\")) {
    return false;
  }
  // Iteratively decode percent-encoded characters (e.g. %2f, %5c, double
  // encoding) so prefix checks see what the browser would resolve after
  // URL parsing; malformed sequences are rejected outright.
  let decoded = url;
  try {
    let passes = 0;
    while (decoded.includes("%") && passes < 3) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
      passes++;
    }
  } catch {
    return false;
  }

  if (decoded.startsWith("//") || decoded.startsWith("/\\")) {
    return false;
  }
  // Reject ASCII control characters (0x00-0x1F, 0x7F) anywhere — browsers
  // strip them, so a value like "/\tevil.com" would otherwise survive the
  // bare prefix check and resolve as a host change in `new URL()`.
  for (let i = 0; i < decoded.length; i++) {
    const code = decoded.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return false;
    }
  }
  // Reject whitespace directly after the leading slash (browser URL
  // normalization can collapse "/ evil.com" into a host change).
  if (/\s/.test(decoded[1] ?? "")) {
    return false;
  }
  return true;
}
