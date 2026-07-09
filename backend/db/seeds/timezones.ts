import { db } from "@/backend/db/drizzleDb";
import { timezones } from "@/backend/db/schema";
import { IanaTimezone } from "@/backend/enum/timezone.enum";
import logger from "@/backend/lib/logger";

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

  const results = [];

  for (const tz of commonTimezones) {
    const [inserted] = await db
      .insert(timezones)
      .values(tz)
      .onConflictDoUpdate({
        target: timezones.ianaId,
        set: { baseOffsetMinutes: tz.baseOffsetMinutes },
      })
      .returning();

    results.push(inserted);
  }

  return results;
}
