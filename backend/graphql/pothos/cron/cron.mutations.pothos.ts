import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { CronConcurrencyPolicy, CronTriggerSource } from "@/backend/enum/cron/cron.enums";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CronRunObject,
  CronRunRetryInput,
  CronRunTriggerInput,
  CronScheduleDeleteInput,
  CronScheduleObject,
  CronScheduleSubmitInputRef,
  CronScheduleUpdateInputRef,
  handleNotFoundError,
  isRecordOrNull,
} from "@/backend/graphql/pothos/cron/cron.schema.pothos";
import { logger } from "@/backend/lib/logger";
import { CronService } from "@/backend/services";
import type { CronScheduleSubmitInput, CronScheduleUpdateInput } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const CRON_MANAGE_SCOPES = { $all: { permission: AppPermission.CRON_MANAGE, notImpersonating: true } };

gqlSchemaBuilder.mutationFields(t => ({
  cronScheduleCreate: t.field({
    type: CronScheduleObject,
    authScopes: CRON_MANAGE_SCOPES,
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
    authScopes: CRON_MANAGE_SCOPES,
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
}));

gqlSchemaBuilder.mutationFields(t => ({
  cronSchedulePause: t.field({
    type: CronScheduleObject,
    nullable: true,
    authScopes: CRON_MANAGE_SCOPES,
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
    authScopes: CRON_MANAGE_SCOPES,
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
    authScopes: CRON_MANAGE_SCOPES,
    args: { input: t.arg({ type: CronScheduleDeleteInput, required: true }) },
    description: "Delete a cron schedule (soft by default, hard if specified).",
    resolve: async (_root, args, ctx) => {
      await CronService.deleteSchedule({ id: args.input.id, hard: args.input.hard ?? false }, ctx.locale);
      return true;
    },
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
  cronRunTrigger: t.field({
    type: CronRunObject,
    nullable: true,
    authScopes: CRON_MANAGE_SCOPES,
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
    authScopes: CRON_MANAGE_SCOPES,
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
