/**
 * Resolves the effective class avatar URL.
 * Recurring schedule override takes precedence over subject default.
 */
export function resolveClassAvatarUrl(
  recurringAvatarUrl: string | null | undefined,
  subjectAvatarUrl: string | null | undefined
): string | null {
  const recurring = recurringAvatarUrl?.trim();
  if (recurring) {
    return recurring;
  }
  const subject = subjectAvatarUrl?.trim();
  return subject ?? null;
}
