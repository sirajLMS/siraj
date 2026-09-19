import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { CronConcurrencyPolicy, CronTriggerSource } from "@/backend/enum/cron/cron.enums";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CronConcurrencyPolicyPothosEnum,
  CronJobKindPothosEnum,
  CronRunStatusPothosEnum,
  CronScheduleStatusPothosEnum,
  CronTriggerSourcePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { logger } from "@/backend/lib/logger";
import { CronService } from "@/backend/services";
import type {
  CronQueueStats,
  CronRunListInput,
  CronRunListResult,
  CronRunReturnType,
  CronScheduleListResult,
  CronScheduleReturnType,
  CronScheduleSubmitInput,
  CronScheduleUpdateInput,
} from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ─── Object Types ────────────────────────────────────────────────────────────

export const CronScheduleObject = gqlSchemaBuilder.objectRef<CronScheduleReturnType>("CronSchedule").implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    cronExpression: t.exposeString("cronExpression"),
    jobKind: t.expose("jobKind", { type: CronJobKindPothosEnum }),
    payload: t.field({
      type: "JSON",
      nullable: true,
      resolve: parent => parent.payload,
    }),
    status: t.expose("status", { type: CronScheduleStatusPothosEnum }),
    timezone: t.exposeString("timezone"),
    nextRunAt: t.expose("nextRunAt", { type: "DateTime", nullable: true }),
    lastRunAt: t.expose("lastRunAt", { type: "DateTime", nullable: true }),
    concurrencyPolicy: t.expose("concurrencyPolicy", { type: CronConcurrencyPolicyPothosEnum }),
    maxRetries: t.exposeInt("maxRetries"),
    retryBackoffSeconds: t.exposeInt("retryBackoffSeconds"),
    timeoutSeconds: t.exposeInt("timeoutSeconds"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const CronRunObject = gqlSchemaBuilder.objectRef<CronRunReturnType>("CronRun").implement({
  fields: t => ({
    id: t.exposeString("id"),
    scheduleId: t.exposeString("scheduleId"),
    jobKind: t.expose("jobKind", { type: CronJobKindPothosEnum }),
    status: t.expose("status", { type: CronRunStatusPothosEnum }),
    triggerSource: t.expose("triggerSource", { type: CronTriggerSourcePothosEnum }),
    payload: t.field({
      type: "JSON",
      nullable: true,
      resolve: parent => parent.payload,
    }),
    attempt: t.exposeInt("attempt"),
    startedAt: t.expose("startedAt", { type: "DateTime" }),
    completedAt: t.expose("completedAt", { type: "DateTime", nullable: true }),
    durationMs: t.exposeInt("durationMs", { nullable: true }),
    errorMessage: t.exposeString("errorMessage", { nullable: true }),
    workerId: t.exposeString("workerId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

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

// ─── Input Types ────────────────────────────────────────────────────────────
//
// NOTE: The following Pothos input types re-declare field-by-field the same structure
// as the canonical TypeScript types in `backend/types/cron/cron.types.ts` (e.g.
// CronScheduleSubmitInput, CronScheduleUpdateInput, CronRunListInput).
// Pothos does not support compile-time binding between an input type definition and
// a TypeScript interface/type, so these definitions are intentionally maintained in
// parallel. Keep them in sync with the canonical types when fields change.

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

/** Fields shared by both submit and update input types — all optional. */
function commonScheduleOptionalFields(t: Parameters<Parameters<typeof gqlSchemaBuilder.inputType>[1]["fields"]>[0]) {
  return {
    description: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
    payload: t.field({ type: "JSON", required: false }),
    timezone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    concurrencyPolicy: t.field({ type: CronConcurrencyPolicyPothosEnum, required: false }),
    maxRetries: t.int({ required: false, directives: { constraint: { min: 1, max: 10 } } }),
    retryBackoffSeconds: t.int({ required: false, directives: { constraint: { min: 1, max: 3600 } } }),
    timeoutSeconds: t.int({ required: false, directives: { constraint: { min: 1, max: 600 } } }),
  };
}

const CronScheduleSubmitInputRef = gqlSchemaBuilder.inputType("CronScheduleSubmitInput", {
  fields: t => ({
    name: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
    cronExpression: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    jobKind: t.field({ type: CronJobKindPothosEnum, required: true }),
    ...commonScheduleOptionalFields(t),
  }),
});

const CronScheduleUpdateInputRef = gqlSchemaBuilder.inputType("CronScheduleUpdateInput", {
  fields: t => ({
    name: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    cronExpression: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    jobKind: t.field({ type: CronJobKindPothosEnum, required: false }),
    ...commonScheduleOptionalFields(t),
  }),
});

const CronScheduleDeleteInput = gqlSchemaBuilder.inputType("CronScheduleDeleteInput", {
  fields: t => ({
    id: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    hard: t.boolean({ required: false }),
  }),
});

const CronRunTriggerInput = gqlSchemaBuilder.inputType("CronRunTriggerInput", {
  fields: t => ({
    id: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    payload: t.field({ type: "JSON", required: false }),
  }),
});

const CronRunRetryInput = gqlSchemaBuilder.inputType("CronRunRetryInput", {
  fields: t => ({
    runId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    attempt: t.int({ required: false }),
  }),
});

// ─── Type Guards ──────────────────────────────────────────────────────────────

function isRecordOrNull(value: unknown): value is Record<string, unknown> | null {
  if (value === null) return true;
  return typeof value === "object" && !Array.isArray(value);
}

// ─── Error Handler ────────────────────────────────────────────────────────────

export function handleNotFoundError(result: unknown, id: string, tErrors: ErrorsLabels): asserts result {
  if (result == null) {
    throw new GraphQLError(tErrors.notFound, {
      extensions: { code: "NOT_FOUND", id },
    });
  }
}

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

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationFields(t => ({
  cronScheduleCreate: t.field({
    type: CronScheduleObject,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: { input: t.arg({ type: CronScheduleSubmitInputRef, required: true }) },
    description: "Create a new cron schedule.",
    resolve: async (_root, args, ctx) => {
      // NOTE: This object literal must match CronScheduleSubmitInput from
      // backend/types/cron/cron.types.ts. See the input-types comment above.
      const input = {
        name: args.input.name,
        description: args.input.description ?? null,
        cronExpression: args.input.cronExpression,
        jobKind: args.input.jobKind,
        payload: isRecordOrNull(args.input.payload) ? args.input.payload : null,
        timezone: args.input.timezone ?? IanaTimezone.UTC,
        concurrencyPolicy: args.input.concurrencyPolicy ?? CronConcurrencyPolicy.ALLOW,
        maxRetries: args.input.maxRetries ?? 3,
        retryBackoffSeconds: args.input.retryBackoffSeconds ?? 60,
        timeoutSeconds: args.input.timeoutSeconds ?? 300,
      } satisfies CronScheduleSubmitInput;
      return CronService.createSchedule(input, ctx.locale, ctx.user?.id);
    },
  }),
  cronScheduleUpdate: t.field({
    type: CronScheduleObject,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      input: t.arg({ type: CronScheduleUpdateInputRef, required: true }),
    },
    description: "Update an existing cron schedule.",
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const input = {
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        cronExpression: args.input.cronExpression ?? undefined,
        jobKind: args.input.jobKind ?? undefined,
        payload: isRecordOrNull(args.input.payload) ? args.input.payload : undefined,
        timezone: args.input.timezone ?? undefined,
        concurrencyPolicy: args.input.concurrencyPolicy ?? undefined,
        maxRetries: args.input.maxRetries ?? undefined,
        retryBackoffSeconds: args.input.retryBackoffSeconds ?? undefined,
        timeoutSeconds: args.input.timeoutSeconds ?? undefined,
      } satisfies CronScheduleUpdateInput;
      const result = await CronService.updateSchedule(args.id, input, ctx.locale, ctx.user?.id);
      handleNotFoundError(result, args.id, tErrors);
      return result;
    },
  }),
  cronSchedulePause: t.field({
    type: CronScheduleObject,
    nullable: true,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: { id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }) },
    description: "Pause a cron schedule.",
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const result = await CronService.pauseSchedule(args.id, ctx.locale);
      handleNotFoundError(result, args.id, tErrors);
      return result;
    },
  }),
  cronScheduleResume: t.field({
    type: CronScheduleObject,
    nullable: true,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: { id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }) },
    description: "Resume a paused cron schedule.",
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const result = await CronService.resumeSchedule(args.id, ctx.locale);
      handleNotFoundError(result, args.id, tErrors);
      return result;
    },
  }),
  cronScheduleDelete: t.boolean({
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: { input: t.arg({ type: CronScheduleDeleteInput, required: true }) },
    description: "Delete a cron schedule (soft by default, hard if specified).",
    resolve: async (_root, args, ctx) => {
      await CronService.deleteSchedule({ id: args.input.id, hard: args.input.hard ?? false }, ctx.locale);
      return true;
    },
  }),
  cronRunTrigger: t.field({
    type: CronRunObject,
    nullable: true,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: { input: t.arg({ type: CronRunTriggerInput, required: true }) },
    description: "Manually trigger a cron schedule to run immediately.",
    resolve: async (_root, args, ctx) => {
      const result = await CronService.dispatchScheduleById(
        {
          id: args.input.id,
          source: CronTriggerSource.MANUAL,
          payload: isRecordOrNull(args.input.payload) ? args.input.payload : null,
        },
        ctx.locale
      );
      // If SKIP concurrency policy skipped the dispatch (an in-flight run exists),
      // signal the skip to the client by returning null instead of returning the
      // unrelated in-flight run. The resolver declares nullable: true.
      if (!result.runId || result.skipped) {
        return null;
      }
      logger.info("cron.graphql.trigger", {
        scheduleId: args.input.id,
        runId: result.runId,
      });
      return CronService.getRunById(result.runId);
    },
  }),
  cronRunRetry: t.field({
    type: CronRunObject,
    nullable: true,
    authScopes: { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } },
    args: {
      input: t.arg({ type: CronRunRetryInput, required: true }),
    },
    description: "Retry a failed cron run.",
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;

      // enqueueRetry handles DB-first-then-queue ordering: it updates the
      // run status to RETRYING and only then sends the job to the queue.
      // If the DB update throws (e.g. run is COMPLETED/CANCELLED), the job
      // is never queued, avoiding orphaned queue entries.
      await CronService.enqueueRetry(args.input.runId, args.input.attempt ?? undefined);

      // Fetch and return the updated run
      const result = await CronService.getRunById(args.input.runId);
      if (!result) {
        throw new GraphQLError(tErrors.notFound, {
          extensions: { code: "NOT_FOUND", id: args.input.runId },
        });
      }
      return result;
    },
  }),
}));
