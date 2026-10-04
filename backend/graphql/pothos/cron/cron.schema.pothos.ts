import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CronConcurrencyPolicyPothosEnum,
  CronJobKindPothosEnum,
  CronRunStatusPothosEnum,
  CronScheduleStatusPothosEnum,
  CronTriggerSourcePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CronRunReturnType, CronScheduleReturnType } from "@/backend/types";
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

// ─── Input Types ────────────────────────────────────────────────────────────
//
// NOTE: The following Pothos input types re-declare field-by-field the same structure
// as the canonical TypeScript types in `backend/types/cron/cron.types.ts` (e.g.
// CronScheduleSubmitInput, CronScheduleUpdateInput, CronRunListInput).
// Pothos does not support compile-time binding between an input type definition and
// a TypeScript interface/type, so these definitions are intentionally maintained in
// parallel. Keep them in sync with the canonical types when fields change.

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

export const CronScheduleSubmitInputRef = gqlSchemaBuilder.inputType("CronScheduleSubmitInput", {
  fields: t => ({
    name: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
    cronExpression: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    jobKind: t.field({ type: CronJobKindPothosEnum, required: true }),
    ...commonScheduleOptionalFields(t),
  }),
});

export const CronScheduleUpdateInputRef = gqlSchemaBuilder.inputType("CronScheduleUpdateInput", {
  fields: t => ({
    name: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    cronExpression: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    jobKind: t.field({ type: CronJobKindPothosEnum, required: false }),
    ...commonScheduleOptionalFields(t),
  }),
});

export const CronScheduleDeleteInput = gqlSchemaBuilder.inputType("CronScheduleDeleteInput", {
  fields: t => ({
    id: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    hard: t.boolean({ required: false }),
  }),
});

export const CronRunTriggerInput = gqlSchemaBuilder.inputType("CronRunTriggerInput", {
  fields: t => ({
    id: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    payload: t.field({ type: "JSON", required: false }),
  }),
});

export const CronRunRetryInput = gqlSchemaBuilder.inputType("CronRunRetryInput", {
  fields: t => ({
    runId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    attempt: t.int({ required: false }),
  }),
});

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function isRecordOrNull(value: unknown): value is Record<string, unknown> | null {
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
