import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction, PayrollGraceSettings, SystemSettingSelectType } from "@/backend/types";

const DEFAULT_PAYROLL_GRACE_SETTINGS: PayrollGraceSettings = {
  shortMinutes: 3,
  longMinutes: 6,
  thresholdMinutes: 30,
};

const GRACE_SETTING_KEYS = {
  shortMinutes: "payroll.grace_short_minutes",
  longMinutes: "payroll.grace_long_minutes",
  thresholdMinutes: "payroll.grace_threshold_minutes",
} as const;

/**
 * Parses one grace setting row into minutes.
 *
 * - `undefined` — the row is absent; the default applies silently so a
 *   not-yet-seeded installation still calculates.
 * - `null` — the row exists but holds no parseable integer; treated as
 *   misconfiguration so operators can correct the stored value.
 * - otherwise the parsed integer value.
 */
function parseGraceMinutes(row: SystemSettingSelectType | null): number | null | undefined {
  if (row?.value == null) {
    return undefined;
  }
  const parsed = Number.parseInt(row.value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Resolves the payroll grace-period thresholds from system settings on every
 * invocation (no caching, so admin updates apply to the next calculation).
 *
 * Absent rows fall back to their defaults silently. Any present-but-invalid
 * row — a non-integer value, negative short/long grace, or a threshold below
 * one minute — is treated as misconfiguration: a structured warning is logged
 * and every threshold falls back to its default, because a partially trusted
 * grace configuration could silently misprice sessions.
 */
export async function resolveGraceSettings(tx?: DBTransaction): Promise<PayrollGraceSettings> {
  const [shortRow, longRow, thresholdRow] = await Promise.all([
    SystemSettingsRepository.getByKey(GRACE_SETTING_KEYS.shortMinutes, tx),
    SystemSettingsRepository.getByKey(GRACE_SETTING_KEYS.longMinutes, tx),
    SystemSettingsRepository.getByKey(GRACE_SETTING_KEYS.thresholdMinutes, tx),
  ]);

  const shortMinutes = parseGraceMinutes(shortRow);
  const longMinutes = parseGraceMinutes(longRow);
  const thresholdMinutes = parseGraceMinutes(thresholdRow);

  const hasUnparseableRow = shortMinutes === null || longMinutes === null || thresholdMinutes === null;
  const hasOutOfRangeValue =
    (shortMinutes != null && shortMinutes < 0) ||
    (longMinutes != null && longMinutes < 0) ||
    (thresholdMinutes != null && thresholdMinutes < 1);

  if (hasUnparseableRow || hasOutOfRangeValue) {
    logger.warn("Payroll grace settings are misconfigured; falling back to defaults", {
      shortMinutes: shortRow?.value ?? null,
      longMinutes: longRow?.value ?? null,
      thresholdMinutes: thresholdRow?.value ?? null,
    });
    return { ...DEFAULT_PAYROLL_GRACE_SETTINGS };
  }

  return {
    shortMinutes: shortMinutes ?? DEFAULT_PAYROLL_GRACE_SETTINGS.shortMinutes,
    longMinutes: longMinutes ?? DEFAULT_PAYROLL_GRACE_SETTINGS.longMinutes,
    thresholdMinutes: thresholdMinutes ?? DEFAULT_PAYROLL_GRACE_SETTINGS.thresholdMinutes,
  };
}
