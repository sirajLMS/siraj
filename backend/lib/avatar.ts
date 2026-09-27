import { isSafeUrl } from "@/shared/lib/safe-url";

/**
 * Accepts only http(s) URLs or same-origin relative paths starting with a
 * single `/`. Rejects javascript:, data:, vbscript:, protocol-relative `//`,
 * backslash tricks, and control characters.
 */
function isSafeAvatarUrl(url: string): boolean {
  if (isSafeUrl(url) !== "") {
    return true;
  }
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) {
    return false;
  }
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return false;
    }
  }
  return !/\s/.test(url[1] ?? "");
}

/**
 * Resolves the effective class avatar URL.
 * Recurring schedule override takes precedence over subject default.
 * Unsafe URL schemes (e.g. javascript:, data:, protocol-relative) are discarded.
 */
export function resolveClassAvatarUrl(
  recurringAvatarUrl: string | null | undefined,
  subjectAvatarUrl: string | null | undefined
): string | null {
  const recurring = recurringAvatarUrl?.trim();
  if (recurring && isSafeAvatarUrl(recurring)) {
    return recurring;
  }
  const subject = subjectAvatarUrl?.trim();
  if (subject && isSafeAvatarUrl(subject)) {
    return subject;
  }
  return null;
}
