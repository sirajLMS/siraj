import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { classInstances } from "@/backend/db/schema";
import type { ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";

/**
 * Resolve the upcoming class instances whose `scheduledStartAt` falls within
 * the next `withinHours` hours (relative to "now"). Used by the daily
 * class-reminder cron (`app/api/cron/class-reminders/route.ts`) to find the
 * candidate set for `CLASS_REMINDER` dispatch.
 *
 * Filtering rules:
 *   - `scheduledStartAt >= now` (anything already in the past is skipped —
 *     reminders are pre-class, never late)
 *   - `scheduledStartAt <= now + withinHours hours` (the reminder window)
 *   - `executionState = NOT_ACTIVATED` (we only remind on instances that have
 *     not yet been auto-activated by the class lifecycle; see
 *     `backend/enum/classes/class-instance-detail.enum.ts`)
 *   - `deletedAt IS NULL` (soft-deleted instances are excluded)
 *
 * Per `backend/db/repo/AGENTS.md`:
 *   - Uses `select().from()` (the recommended pattern; avoids the
 *     `SQL<unknown>` type resolution errors found with `.findMany` relations).
 *   - Accepts an optional `tx` so the cron service can read inside a
 *     transaction without seeing old rows.
 *   - Pure data access — no business logic, no logger.
 *
 * @param options.withinHours  Window length in hours (defaults to 24 — the
 *                              cron schedule is daily per `vercel.json`).
 * @param options.now          Optional reference "now" — injected by tests so
 *                              they can pin the window deterministically.
 * @param options.tx           Optional transaction handle.
 * @returns `ClassInstanceSelectType[]` rows ordered by `scheduledStartAt`
 *          ascending so the caller can process them in chronological order.
 */
export async function findUpcomingInstances(
  options: { withinHours?: number; now?: Date; tx?: DBTransaction } = {}
): Promise<ClassInstanceSelectType[]> {
  const withinHours = options.withinHours ?? 24;
  const now = options.now ?? new Date();
  const windowEnd = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  const q = queryDb(options.tx);
  return q
    .select()
    .from(classInstances)
    .where(
      and(
        isNull(classInstances.deletedAt),
        eq(classInstances.executionState, ClassExecutionState.NOT_ACTIVATED),
        gte(classInstances.scheduledStartAt, now),
        lte(classInstances.scheduledStartAt, windowEnd)
      )
    )
    .orderBy(classInstances.scheduledStartAt);
}
