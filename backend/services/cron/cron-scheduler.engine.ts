/**
 * Pure cron-expression → Date calculator.
 *
 * Wraps `cron-parser` v5 to provide validation and next-run computation.
 * No I/O — all functions are pure and synchronous.
 */
import { type CronExpression, CronExpressionParser, type CronFieldCollection } from "cron-parser";
import { DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { formatError } from "@/backend/services/cron/cron-utils";

export class InvalidCronExpression extends DomainError {
  constructor(expr: string, reason: string) {
    super("INVALID_CRON_EXPRESSION", `Invalid cron expression "${expr}": ${reason}`);
  }
}

const DEFAULT_TIMEZONE = "UTC";

/** Maximum backoff delay in seconds (1 day). Prevents runaway exponential growth. */
const MAX_BACKOFF_SECONDS = 86_400;

const NAMED_MONTH_PATTERN = /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/i;
const NAMED_DOW_PATTERN = /\b(MON|TUE|WED|THU|FRI|SAT|SUN)\b/i;

/**
 * Collect Vercel-restricted syntax reasons from a cron expression.
 *
 * When `parsedFields` (from `CronExpressionParser.parse(expr).fields`) is
 * provided, structured field checks run (day-of-month/day-of-week combination
 * using wildcard/? detection from the parsed field collection). Named-token
 * regex checks always run against the raw `expr` since parse normalises names
 * to numeric values.
 *
 * When `parsedFields` is omitted, only the raw-expression regex checks run
 * (named tokens); no DOM/DOW combination test is possible.
 */
function collectRestrictedReasons(expr: string, parsedFields?: CronExpression["fields"]): string[] {
  const reasons: string[] = [];

  if (parsedFields) {
    const dayOfMonth = parsedFields.dayOfMonth;
    const dayOfWeek = parsedFields.dayOfWeek;

    if (NAMED_MONTH_PATTERN.test(expr)) {
      reasons.push("named month tokens (JAN-DEC)");
    }
    if (NAMED_DOW_PATTERN.test(expr)) {
      reasons.push("named day-of-week tokens (MON-SUN)");
    }
    if (
      !dayOfMonth.isWildcard &&
      !dayOfMonth.hasQuestionMarkChar &&
      !dayOfWeek.isWildcard &&
      !dayOfWeek.hasQuestionMarkChar
    ) {
      reasons.push("both day-of-month and day-of-week specified");
    }
  } else {
    if (NAMED_MONTH_PATTERN.test(expr)) {
      reasons.push("named month tokens (JAN-DEC)");
    }
    if (NAMED_DOW_PATTERN.test(expr)) {
      reasons.push("named day-of-week tokens (MON-SUN)");
    }
  }

  return reasons;
}

/**
 * Warn (dev logs only) when a cron expression uses syntax that Vercel's cron
 * platform does not support. This is advisory — the expression is still valid
 * for cron-parser and does not block creation/updates.
 *
 * Vercel-restricted syntax:
 * - Named month tokens (JAN-DEC)
 * - Named day-of-week tokens (MON-SUN)
 * - Both day-of-month AND day-of-week specified (non-* non-?)
 */
function warnOnVercelRestrictedSyntax(expr: string, fields?: CronFieldCollection): void {
  const reasons = collectRestrictedReasons(expr, fields);

  if (reasons.length > 0) {
    logger.warn("cron.engine.vercelRestrictedSyntax", {
      cronExpression: expr,
      reasons: reasons.join(", "),
      note: "Vercel cron does not support this syntax; it is valid for cron-parser but may not fire on Vercel.",
    });
  }
}

/**
 * Validate a cron expression string.
 * Returns `true` if valid, `false` otherwise.
 * Emits a dev-log warning for Vercel-restricted syntax.
 */
export function validateCronExpression(expr: string): boolean {
  try {
    const parsed = CronExpressionParser.parse(expr);
    warnOnVercelRestrictedSyntax(expr, parsed.fields);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute the next fire time for a cron expression from a baseline Date.
 * Always returns a Date in UTC.
 */
export function nextRunAt(cronExpression: string, from: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): Date {
  try {
    const options = timezone === DEFAULT_TIMEZONE ? { currentDate: from } : { tz: timezone, currentDate: from };
    const interval = CronExpressionParser.parse(cronExpression, options);
    const next = interval.next();
    return next.toDate();
  } catch (err) {
    const reason = formatError(err);
    logger.error("cron.engine.nextRunAt.failed", { cronExpression, reason });
    throw new InvalidCronExpression(cronExpression, reason);
  }
}

/**
 * Compute the next N fire times for a cron expression from a baseline Date.
 * @internal Test-only — production code does not call this.
 * The create/edit dialog preview computes runs inline via CronExpressionParser.
 */
function nextRuns(cronExpression: string, from: Date, count: number, timezone: string = DEFAULT_TIMEZONE): Date[] {
  try {
    const options = timezone === DEFAULT_TIMEZONE ? { currentDate: from } : { tz: timezone, currentDate: from };
    const interval = CronExpressionParser.parse(cronExpression, options);
    const results: Date[] = [];
    for (let i = 0; i < count; i++) {
      const next = interval.next();
      results.push(next.toDate());
    }
    return results;
  } catch (err) {
    const reason = formatError(err);
    logger.error("cron.engine.nextRuns.failed", { cronExpression, reason });
    throw new InvalidCronExpression(cronExpression, reason);
  }
}

/** @internal Re-exported for unit tests only. */
export { nextRuns as _nextRunsForTest };

/**
 * Compute exponential backoff delay in seconds.
 * Formula: retryBackoffSeconds * 2^(max(1, attempt) - 1), capped at MAX_BACKOFF_SECONDS.
 * The attempt value is floored at 1 so that attempt=0 yields retryBackoffSeconds (not half).
 */
export function computeBackoffSeconds(retryBackoffSeconds: number, attempt: number): number {
  const computed = retryBackoffSeconds * 2 ** (Math.max(1, attempt) - 1);
  return Math.min(computed, MAX_BACKOFF_SECONDS);
}
