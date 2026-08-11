import type { ObjectFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder<ParentShape> = ObjectFieldBuilder<BuilderTypes, ParentShape>;

/**
 * Shared shape for metrics objects that expose `pending`, `rescheduled`,
 * and `leave` integer fields alongside an `id` string field.
 */
interface MetricsSharedShape {
  readonly id?: string;
  readonly pending: number;
  readonly rescheduled: number;
  readonly leave: number;
}

interface MetricsFieldOptions {
  /** When true, `id` is nullable (e.g. DailyScheduleMetrics). */
  readonly idNullable?: boolean;
}

/**
 * Shared metrics fields for `DailyScheduleMetrics` and
 * `RescheduleTrackingMetrics`. Both expose `id`, `pending`,
 * `rescheduled`, and `leave`; the `id` nullability differs.
 */
export function classSessionMetricsFields(
  t: PothosObjectFieldBuilder<MetricsSharedShape>,
  options: MetricsFieldOptions = {}
) {
  const idField = options.idNullable ? t.exposeString("id", { nullable: true }) : t.exposeString("id");

  return {
    id: idField,
    pending: t.exposeInt("pending"),
    rescheduled: t.exposeInt("rescheduled"),
    leave: t.exposeInt("leave"),
  };
}
