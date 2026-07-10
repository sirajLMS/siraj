import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classStatusEvents } from "@/backend/db/schema/classes/scheduling";
import type { SeedConfig } from "@/backend/db/seeds/lib";
import { ClassExecutionState, ClassOutcome } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity, TeacherEntity } from "@/backend/types";

export async function seedOrGet(
  classInstancesList: ClassInstanceEntity[],
  teachersList?: TeacherEntity[],
  _config?: SeedConfig
) {
  logger.info("Seeding system class status events...");
  if (!classInstancesList?.length) {
    throw new Error("No class instances available to link to status events.");
  }
  if (!teachersList?.length) {
    throw new Error("No teachers available to resolve user IDs for status events.");
  }

  const teacherUserIdMap = new Map(teachersList.map(t => [t.id, t.userId]));
  const results = [];

  for (const instance of classInstancesList) {
    if (instance.outcome === ClassOutcome.PENDING && instance.executionState === ClassExecutionState.NOT_ACTIVATED) {
      continue;
    }

    const actorUserId = teacherUserIdMap.get(instance.teacherId);
    if (!actorUserId) continue;

    const [existing] = await db
      .select({ id: classStatusEvents.id })
      .from(classStatusEvents)
      .where(eq(classStatusEvents.classInstanceId, instance.id))
      .limit(1);

    if (existing) continue;

    const eventCreatedAt = instance.actualEndAt ?? instance.scheduledEndAt;

    const [inserted] = await db
      .insert(classStatusEvents)
      .values({
        classInstanceId: instance.id,
        eventType: "STATE_CHANGE",
        fromState: { executionState: ClassExecutionState.NOT_ACTIVATED, outcome: ClassOutcome.PENDING },
        toState: { executionState: instance.executionState, outcome: instance.outcome },
        description: "Status changed by system seeder",
        actorUserId,
        createdAt: eventCreatedAt,
      })
      .returning();

    results.push(inserted);
  }

  logger.info(`System class status events seeded (${results.length} rows).`);
  return results;
}
