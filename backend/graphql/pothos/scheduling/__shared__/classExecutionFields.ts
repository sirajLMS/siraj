import type { ObjectFieldBuilder } from "@pothos/core";
import type { ClassExecutionState, ClassOutcome } from "@/backend/enum";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EffectiveMeetingPothosObject } from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import { ClassExecutionStatePothosObject, ClassOutcomePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { EffectiveMeetingReturnType } from "@/backend/types/meeting/class-meeting-config.types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder<ParentShape> = ObjectFieldBuilder<BuilderTypes, ParentShape>;

/**
 * Shared shape covering the fields common to objects that expose
 * class execution state: DailyScheduleList, StatusTrackingScheduleRow,
 * and WeeklyScheduleClass.
 */
interface ClassExecutionFieldShape {
  readonly executionState?: ClassExecutionState | null;
  readonly outcome?: ClassOutcome | null;
  readonly isFrozen: boolean;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingReturnType | null;
}

/**
 * Options to control nullability of the shared fields, since
 * {@link WeeklyScheduleClassPothosObject} marks `executionState` and `outcome`
 * as nullable, while the others do not.
 */
interface ClassExecutionFieldOptions {
  readonly executionStateNullable?: boolean;
  readonly outcomeNullable?: boolean;
}

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
