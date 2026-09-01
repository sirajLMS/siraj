/**
 * Shared helpers for quota audience views — date calculations and status
 * label lookups used by StudentQuotaView, ParentQuotaView, TeacherQuotaView,
 * and SupervisorQuotaView.
 */

const EXPIRY_WARNING_THRESHOLD_DAYS = 7;

/**
 * Returns the number of days from now until `validUntil`. Returns `null`
 * when `validUntil` is missing or cannot be parsed.
 */
function daysUntilExpiry(validUntil: string | null | undefined): number | null {
  if (validUntil == null || validUntil.length === 0) return null;
  const expiryDate = new Date(validUntil);
  if (Number.isNaN(expiryDate.getTime())) return null;
  const now = new Date();
  const diff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Returns `true` when the quota expiry date is within
 * {@link EXPIRY_WARNING_THRESHOLD_DAYS} days and not yet expired.
 */
export function isExpiringSoon(validUntil: string | null | undefined): boolean {
  const diff = daysUntilExpiry(validUntil);
  if (diff === null) return false;
  return diff >= 0 && diff <= EXPIRY_WARNING_THRESHOLD_DAYS;
}

/**
 * Returns `true` when the quota has zero remaining classes.
 */
export function isQuotaExhausted(remaining: number | null | undefined): boolean {
  return remaining !== null && remaining !== undefined && remaining <= 0;
}

/**
 * Returns the hard-coded threshold for showing an expiry warning banner.
 */
export function getExpiryWarningThreshold(): number {
  return EXPIRY_WARNING_THRESHOLD_DAYS;
}
