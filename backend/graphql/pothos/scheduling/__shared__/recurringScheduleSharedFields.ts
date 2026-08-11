import type { ObjectFieldBuilder, ObjectRef } from "@pothos/core";
import type { CurrencyCode } from "@/backend/enum";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject, IanaTimezonePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  RecurringScheduleDayDetailReturnType,
  RecurringScheduleDetailReturnType,
  RecurringScheduleListItem,
} from "@/backend/types/scheduling/recurring-schedule-detail.types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder<ParentShape> = ObjectFieldBuilder<BuilderTypes, ParentShape>;

/**
 * Shared shape covering the 9 fields common to both RecurringScheduleDetail
 * and RecurringScheduleListItem (id, studentId, studentName, teacherId,
 * teacherName, durationMinutes, defaultStartTime, hourlyRate, rateCurrency).
 */
interface RecurringScheduleSharedShape {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly teacherId: string;
  readonly teacherName: string;
  readonly durationMinutes: number;
  readonly defaultStartTime: string;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: CurrencyCode | null;
}

/**
 * Shared 9 field definitions for recurring schedule Pothos objects.
 * Used by both RecurringScheduleDetailPothosObject and
 * RecurringScheduleListItemPothosObject to eliminate field-level duplication.
 *
 * Returns the common fields object; callers prepend or append
 * their own type-specific fields (e.g. `timezone`, `days` for Detail,
 * `timezone`, `createdAt`/`updatedAt` for ListItem).
 */
export function recurringScheduleSharedFields(t: PothosObjectFieldBuilder<RecurringScheduleSharedShape>) {
  return {
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    durationMinutes: t.exposeInt("durationMinutes"),
    defaultStartTime: t.exposeString("defaultStartTime"),
    hourlyRate: t.exposeString("hourlyRate", { nullable: true }),
    rateCurrency: t.expose("rateCurrency", { type: CurrencyCodePothosObject, nullable: true }),
  };
}

/**
 * Field definitions for RecurringScheduleDetailPothosObject.
 * Adds `timezone` (typed IanaTimezonePothosObject) and `days` (array of day detail objects).
 * The `dayDetailTypeRef` is passed in to avoid a circular import.
 */
export function recurringScheduleDetailFields(
  t: PothosObjectFieldBuilder<RecurringScheduleDetailReturnType>,
  dayDetailTypeRef: ObjectRef<BuilderTypes, RecurringScheduleDayDetailReturnType>
) {
  return {
    ...recurringScheduleSharedFields(t),
    timezone: t.expose("timezone", { type: IanaTimezonePothosObject }),
    days: t.expose("days", { type: [dayDetailTypeRef] }),
  };
}

/**
 * Field definitions for RecurringScheduleListItemPothosObject.
 * Adds `timezone` (plain string), `createdAt`, and `updatedAt`.
 */
export function recurringScheduleListItemFields(t: PothosObjectFieldBuilder<RecurringScheduleListItem>) {
  return {
    ...recurringScheduleSharedFields(t),
    timezone: t.exposeString("timezone"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  };
}
