import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { parseIanaTimezone } from "@/shared/lib/enum";

/**
 * Resolves the viewer's IANA timezone for schedule day-boundary calculations.
 * Prefers the user's profile timezone; falls back to system default_timezone.
 */
export async function resolveViewerTimezone(userId: string): Promise<IanaTimezone> {
  const user = await UserRepository.findById(userId);
  if (user?.timezone) {
    return parseIanaTimezone(user.timezone);
  }

  const defaultTimezone = await SystemSettingsRepository.getStringValue("default_timezone", "UTC");
  return parseIanaTimezone(defaultTimezone);
}
