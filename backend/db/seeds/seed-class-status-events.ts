import { db } from "@/backend/db/drizzleDb";
import { classStatusEvents } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity, TeacherEntity } from "@/backend/types";

export async function seedOrGet(classInstancesList: ClassInstanceEntity[], teachersList?: TeacherEntity[]) {
  logger.info("Seeding system class status events...");
  const now = new Date();

  if (!classInstancesList || classInstancesList.length === 0) {
    throw new Error("No class instances available to link to status events.");
  }
  if (!teachersList || teachersList.length === 0) {
    throw new Error("No teachers available to resolve user IDs for status events.");
  }

  // Create lookup map for teacherId -> userId
  const teacherUserIdMap = new Map(teachersList.map(t => [t.id, t.userId]));

  const results = [];

  for (const instance of classInstancesList) {
    // Only seed status events for non-pending classes
    if (instance.outcome === "PENDING" && instance.executionState === "NOT_ACTIVATED") {
      continue;
    }

    const actorUserId = teacherUserIdMap.get(instance.teacherId);
    if (!actorUserId) continue; // Safety check

    const [inserted] = await db
      .insert(classStatusEvents)
      .values({
        classInstanceId: instance.id,
        eventType: "STATE_CHANGE",
        fromState: { executionState: "NOT_ACTIVATED", outcome: "PENDING" },
        toState: { executionState: instance.executionState, outcome: instance.outcome },
        description: "Status changed by system seeder",
        actorUserId: actorUserId,
        createdAt: now,
      })
      .returning();

    results.push(inserted);
  }

  logger.info("System class status events seeded.");
  return results;
}
