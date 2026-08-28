import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import type { LowHoursThresholdResolution } from "@/backend/types";

/** System-settings key holding the low-hours warning threshold. */
export const LOW_HOURS_THRESHOLD_SETTING_KEY = "accounting_low_hours_threshold";

/** Built-in fallback applied when the setting row is absent. */
export const DEFAULT_LOW_HOURS_THRESHOLD = 5;

/**
 * Resolves the low-hours warning threshold shared by every accounting
 * surface: the low-balance notifier and the balance GraphQL payload must
 * agree on the exact value they compare remaining hours against.
 *
 * The persisted value wins; when the row is missing, the built-in default
 * applies. A configured value that cannot be parsed as a finite number is
 * reported as `value: null` — the same condition under which the notifier
 * skips its alert — while `rawValue` still carries the unparsed string for
 * message interpolation.
 */
export async function resolveLowHoursThreshold(): Promise<LowHoursThresholdResolution> {
  const setting = await SystemSettingsService.getSettingByKey(LOW_HOURS_THRESHOLD_SETTING_KEY);
  const rawValue = setting?.value ?? String(DEFAULT_LOW_HOURS_THRESHOLD);
  const parsed = Number(rawValue);
  return { rawValue, value: Number.isFinite(parsed) ? parsed : null };
}
