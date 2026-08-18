import type { ObjectFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EffectiveMeetingPothosObject } from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import { ClassExecutionStatePothosObject, ClassOutcomePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { ClassExecutionFieldOptions, ClassExecutionFieldShape } from "@/backend/types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder<ParentShape> = ObjectFieldBuilder<BuilderTypes, ParentShape>;

/**
 * Shared tail field definitions for class execution Pothos objects.
 * Used by DailyScheduleList, StatusTrackingScheduleRow, and
 * WeeklyScheduleClass to eliminate the 5-field duplication.
 */
export function classExecutionFields(
  t: PothosObjectFieldBuilder<ClassExecutionFieldShape>,
  options: ClassExecutionFieldOptions = {}
) {
  return {
    executionState: t.expose("executionState", {
      type: ClassExecutionStatePothosObject,
      ...(options.executionStateNullable ? { nullable: true } : {}),
    }),
    outcome: t.expose("outcome", {
      type: ClassOutcomePothosObject,
      ...(options.outcomeNullable ? { nullable: true } : {}),
    }),
    isFrozen: t.exposeBoolean("isFrozen"),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", { nullable: true }),
    effectiveMeeting: t.expose("effectiveMeeting", { type: EffectiveMeetingPothosObject, nullable: true }),
  };
}
