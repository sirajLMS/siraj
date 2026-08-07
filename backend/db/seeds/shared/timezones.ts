import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { logger } from "@/backend/lib/logger";
import { ReferenceDataService } from "@/backend/services/system/reference-data.service";

export async function seedOrGet() {
  logger.log("Seeding common timezones...");
  const commonTimezones = [
    { ianaId: "UTC", baseOffsetMinutes: 0 },
    { ianaId: "Africa/Cairo", baseOffsetMinutes: 120 },
    { ianaId: "Europe/London", baseOffsetMinutes: 0 },
    { ianaId: "America/New_York", baseOffsetMinutes: -300 },
    { ianaId: "Asia/Dubai", baseOffsetMinutes: 240 },
    { ianaId: IanaTimezone.Asia_Riyadh, baseOffsetMinutes: 180 },
    { ianaId: "Asia/Singapore", baseOffsetMinutes: 480 },
    { ianaId: "Australia/Sydney", baseOffsetMinutes: 600 },
  ];

  return ReferenceDataService.upsertManyTimezones(commonTimezones);
}
