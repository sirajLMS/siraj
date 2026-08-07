import type { SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { GroupClassService } from "@/backend/services/group-class/group-class.service";
import type { ClassCommunicationSelectType } from "@/backend/types";

type GroupClassEntity = { id: string; classInstanceId: string; courseName: string };

export async function seedOrGet(groupClassesList: GroupClassEntity[], _config?: SeedConfig) {
  logger.info("Seeding system class communications...");
  if (!groupClassesList?.length) {
    logger.info("No group classes available for class communications. Skipping.");
    return [];
  }

  const now = new Date();
  const existingIds = await GroupClassService.listGroupClassIdsWithCommunications(
    groupClassesList.map(groupClass => groupClass.id)
  );
  const results: ClassCommunicationSelectType[] = [];

  for (const groupClass of groupClassesList) {
    if (existingIds.has(groupClass.id)) continue;

    const inserted = await GroupClassService.createManyCommunications([
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
    ]);

    results.push(...inserted);
  }

  logger.info(`System class communications seeded (${results.length} rows).`);
  return results;
}
