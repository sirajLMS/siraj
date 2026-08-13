import { orchestrateSeedMany, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ClassSessionService } from "@/backend/services";
import type { ClassInstanceSelectType, ClassStatusEventSelectType, TeacherSelectType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

type StatusEventSpec = {
  classInstanceId: string;
  eventType: string;
  fromState: { executionState: ClassExecutionState; outcome: ClassOutcome };
  toState: { executionState: ClassInstanceSelectType["executionState"]; outcome: ClassInstanceSelectType["outcome"] };
  description: string;
  actorUserId: string;
  createdAt: Date;
};

export async function seedOrGet(
  classInstancesList: ClassInstanceSelectType[],
  teachersList?: TeacherSelectType[],
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
  const specs: StatusEventSpec[] = [];

  for (const instance of classInstancesList) {
    if (instance.outcome === "PENDING" && instance.executionState === "NOT_ACTIVATED") {
      continue;
    }

    const actorUserId = teacherUserIdMap.get(instance.teacherId);
    if (!actorUserId) continue;

    specs.push({
      classInstanceId: instance.id,
      eventType: "STATE_CHANGE",
      fromState: { executionState: ClassExecutionState.NOT_ACTIVATED, outcome: ClassOutcome.PENDING },
      toState: { executionState: instance.executionState, outcome: instance.outcome },
      description: "Status changed by system seeder",
      actorUserId,
      createdAt: instance.actualEndAt ?? instance.scheduledEndAt,
    });
  }

  const results = await orchestrateSeedMany<StatusEventSpec, ClassStatusEventSelectType, string>({
    specs,
    toKey: spec => spec.classInstanceId,
    findExisting: async keys => ClassSessionService.findStatusEventsByClassInstanceIds(keys),
    createMany: async toCreate => ClassSessionService.createManyStatusEvents(toCreate),
    refetchOnRace: async keys => ClassSessionService.findStatusEventsByClassInstanceIds(keys),
  });

  logger.info(`System class status events seeded (${results.length} rows).`);
  return results;
}
