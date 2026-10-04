import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import "@/backend/graphql/pothos/cron/cron.mutations.pothos";
import {
  CronRunObject,
  CronScheduleObject,
  handleNotFoundError,
} from "@/backend/graphql/pothos/cron/cron.schema.pothos";
import {
  CronJobKindPothosEnum,
  CronRunStatusPothosEnum,
  CronScheduleStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { CronService } from "@/backend/services";
import type { CronQueueStats, CronRunListInput, CronRunListResult, CronScheduleListResult } from "@/backend/types";

export { CronRunObject, CronScheduleObject, handleNotFoundError };

const CronQueueStatsObject = gqlSchemaBuilder.objectRef<CronQueueStats>("CronQueueStats").implement({
  fields: t => ({
    // CronQueueStats has no natural id — this synthetic field exists solely for Apollo cache normalization.
    id: t.string({ resolve: () => "cron-queue-stats" }),
    backend: t.exposeString("backend"),
    pending: t.exposeInt("pending"),
    inFlight: t.exposeInt("inFlight"),
    failed: t.exposeInt("failed"),
    byJobKind: t.field({
      type: "JSON",
      resolve: parent => parent.byJobKind,
    }),
  }),
});

const CronPaginatedSchedulesObject = gqlSchemaBuilder
  .objectRef<CronScheduleListResult>("CronPaginatedSchedules")
  .implement({
    fields: t => ({
      rows: t.expose("rows", { type: [CronScheduleObject] }),
      totalCount: t.exposeInt("totalCount"),
    }),
  });

const CronPaginatedRunsObject = gqlSchemaBuilder.objectRef<CronRunListResult>("CronPaginatedRuns").implement({
  fields: t => ({
    rows: t.expose("rows", { type: [CronRunObject] }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

const CronScheduleListInput = gqlSchemaBuilder.inputType("CronScheduleListInput", {
  fields: t => ({
    status: t.field({ type: CronScheduleStatusPothosEnum, required: false }),
    jobKind: t.field({ type: CronJobKindPothosEnum, required: false }),
    name: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    limit: t.int({ required: false, directives: { constraint: { min: 1, max: 200 } } }),
    offset: t.int({ required: false, directives: { constraint: { min: 0, max: 10000 } } }),
  }),
});

const CronRunListInputRef = gqlSchemaBuilder.inputType("CronRunListInput", {
  fields: t => ({
    scheduleId: t.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
    status: t.field({ type: CronRunStatusPothosEnum, required: false }),
    statuses: t.field({ type: [CronRunStatusPothosEnum], required: false }),
    from: t.field({ type: "DateTime", required: false }),
    to: t.field({ type: "DateTime", required: false }),
    limit: t.int({ required: false, directives: { constraint: { min: 1, max: 200 } } }),
    offset: t.int({ required: false, directives: { constraint: { min: 0, max: 10000 } } }),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryFields(t => ({
  cronSchedules: t.field({
    type: CronPaginatedSchedulesObject,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: { input: t.arg({ type: CronScheduleListInput, required: false }) },
    description: "List cron schedules with optional filters.",
    resolve: async (_root, args) => {
      const input = args.input ?? {};
      return CronService.getSchedules({
        status: input.status ?? undefined,
        jobKind: input.jobKind ?? undefined,
        name: input.name ?? undefined,
        limit: input.limit ?? undefined,
        offset: input.offset ?? undefined,
      });
    },
  }),
  cronRuns: t.field({
    type: CronPaginatedRunsObject,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: { input: t.arg({ type: CronRunListInputRef, required: false }) },
    description: "List cron runs with optional filters.",
    resolve: async (_root, args) => {
      const raw = args.input ?? {};
      const input = {
        scheduleId: raw.scheduleId ?? undefined,
        status: raw.status ?? undefined,
        statuses: raw.statuses ?? undefined,
        from: raw.from ?? undefined,
        to: raw.to ?? undefined,
        limit: raw.limit ?? undefined,
        offset: raw.offset ?? undefined,
      } satisfies CronRunListInput;
      return CronService.getRuns(input);
    },
  }),
  cronQueueStats: t.field({
    type: CronQueueStatsObject,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    description: "Get queue statistics for the active queue backend.",
    resolve: async () => CronService.getQueueStats(),
  }),
}));
