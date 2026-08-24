import type { SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { GroupClassService } from "@/backend/services";
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
  const toSeed = groupClassesList.filter(groupClass => !existingIds.has(groupClass.id));

  const insertedArrays = await toSeed.reduce<Promise<ClassCommunicationSelectType[][]>>(async (prev, groupClass) => {
    const acc = await prev;
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
    return [...acc, inserted];
  }, Promise.resolve([]));

  const results: ClassCommunicationSelectType[] = insertedArrays.flat();

  logger.info(`System class communications seeded (${results.length} rows).`);
  return results;
}
