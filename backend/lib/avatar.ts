import { isSafeUrl } from "@/shared/lib/safe-url";

/**
 * Validates that an avatar URL string is safe (either a valid http/https URL
 * or a same-origin relative path starting with a single `/`).
 * Rejects javascript:, data:, vbscript:, protocol-relative `//`, and control characters.
 */
function isSafeAvatarUrl(url: string): boolean {
  if (isSafeUrl(url)) {
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
  if (/\s/.test(url[1] ?? "")) {
    return false;
  }
  return true;
}

/**
 * Resolves the effective class avatar URL.
 * Recurring schedule override takes precedence over subject default.
 * Malicious or unsafe URL schemes (e.g. javascript:, data:, protocol-relative)
 * are rejected and discarded.
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
