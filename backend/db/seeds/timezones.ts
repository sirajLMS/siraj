import logger from "@/backend/lib/logger";
import { db } from "../drizzleDb";
import { timezones } from "../schema";

export async function seedTimezones() {
  logger.log("Seeding common timezones...");
  const commonTimezones = [
    { ianaId: "UTC", baseOffsetMinutes: 0 },
    { ianaId: "Africa/Cairo", baseOffsetMinutes: 120 },
    { ianaId: "Europe/London", baseOffsetMinutes: 0 },
    { ianaId: "America/New_York", baseOffsetMinutes: -300 },
    { ianaId: "Asia/Dubai", baseOffsetMinutes: 240 },
    { ianaId: "Asia/Riyadh", baseOffsetMinutes: 180 },
    { ianaId: "Asia/Singapore", baseOffsetMinutes: 480 },
    { ianaId: "Australia/Sydney", baseOffsetMinutes: 600 },
  ];

  for (const tz of commonTimezones) {
    await db
      .insert(timezones)
      .values(tz)
      .onConflictDoUpdate({
        target: timezones.ianaId,
        set: { baseOffsetMinutes: tz.baseOffsetMinutes },
      });
  }
}
