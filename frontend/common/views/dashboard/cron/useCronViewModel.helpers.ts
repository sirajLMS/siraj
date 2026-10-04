import { CombinedGraphQLErrors } from "@apollo/client";
import { CronExpressionParser } from "cron-parser";
import type { CronScheduleFormData } from "@/frontend/common/views/dashboard/cron/types";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

/**
 * Maps an Apollo/GraphQL error to a user-facing i18n message for cron operations.
 *
 * Checks `CombinedGraphQLErrors` for known `extensions.code` values (e.g.
 * `NOT_FOUND`) and maps them to the matching label. Service-level errors
 * (thrown as plain `Error` with translated messages) arrive as GraphQL errors
 * whose `message` is already localized — those are surfaced directly. Falls
 * back to `labels.errors.genericError` for unrecognised errors.
 */
export function getCronErrorMessage(
  error: unknown,
  labels: CronLabels,
  context: { scheduleId?: string | null; scheduleName?: string; cronExpression?: string }
): string {
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0];
    if (first) {
      const code = first.extensions?.code;
      if (code === "NOT_FOUND" && context.scheduleId) {
        return labels.errors.scheduleNotFound(context.scheduleId);
      }
      // Service-level errors arrive with a translated message but no code.
      if (first.message) {
        return first.message;
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return labels.errors.genericError;
}

function toNullOrNumber(v: string | number): number | null {
  return v === "" ? null : Number(v);
}

export function buildScheduleInput(data: CronScheduleFormData) {
  const payload = data.payload ? JSON.parse(data.payload) : null;
  return {
    name: data.name,
    description: data.description || null,
    cronExpression: data.cronExpression,
    jobKind: data.jobKind,
    payload,
    timezone: data.timezone || null,
    concurrencyPolicy: data.concurrencyPolicy,
    maxRetries: toNullOrNumber(data.maxRetries),
    retryBackoffSeconds: toNullOrNumber(data.retryBackoffSeconds),
    timeoutSeconds: toNullOrNumber(data.timeoutSeconds),
  };
}

export type CronScheduleInputPayload = ReturnType<typeof buildScheduleInput>;

export function previewNextRuns(expression: string, timezone: string): string[] {
  if (!expression) return [];
  try {
    const interval = CronExpressionParser.parse(expression, { tz: timezone || "UTC" });
    const results: string[] = [];
    for (let i = 0; i < 3; i++) {
      const next = interval.next();
      const iso = next.toISOString();
      if (iso) results.push(iso);
    }
    return results;
  } catch {
    return [];
  }
}
