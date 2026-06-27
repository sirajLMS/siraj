import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classCommunications } from "@/backend/db/schema/group-class";
import logger from "@/backend/lib/logger";
import type { SeedConfig } from "./lib";

type GroupClassEntity = { id: string; classInstanceId: string; courseName: string };

export async function seedOrGet(groupClassesList: GroupClassEntity[], _config?: SeedConfig) {
  logger.info("Seeding system class communications...");
  if (!groupClassesList?.length) {
    throw new Error("No group classes available for class communications.");
  }

  const results = [];

  for (const groupClass of groupClassesList) {
    const [existing] = await db
      .select({ id: classCommunications.id })
      .from(classCommunications)
      .where(eq(classCommunications.groupClassId, groupClass.id))
      .limit(1);

    if (existing) continue;

    const now = new Date();

    const inserted = await db
      .insert(classCommunications)
      .values([
        {
          groupClassId: groupClass.id,
          type: "email",
          title: "Class Reminder",
          description: `Reminder for ${groupClass.courseName}`,
          isActive: true,
          isDelivered: true,
          timestamp: new Date(now.getTime() - 86400000),
          notificationDeliveryId: null,
          classStatusEventId: null,
        },
        {
          groupClassId: groupClass.id,
          type: "sms",
          title: "Schedule Update",
          description: `Schedule updated for ${groupClass.courseName}`,
          isActive: true,
          isDelivered: false,
          timestamp: now,
          notificationDeliveryId: null,
          classStatusEventId: null,
        },
      ])
      .returning();

    results.push(...inserted);
  }

  logger.info(`System class communications seeded (${results.length} rows).`);
  return results;
}
