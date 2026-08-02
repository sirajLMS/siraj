import { and, eq, isNull, lt } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { classInstances } from "@/backend/db/schema";
import type * as Types from "@/backend/types";

export const findExpiredPendingInstances = async (
  graceMinutes: number,
  limit: number,
  now: Date,
  tx?: DBTransaction
): Promise<Types.ClassInstanceSelectType[]> => {
  const q = queryDb(tx);
  const missedDeadline = new Date(now.getTime() - graceMinutes * 60_000);

  return q
    .select()
    .from(classInstances)
    .where(
      and(
        isNull(classInstances.deletedAt),
        eq(classInstances.executionState, "NOT_ACTIVATED"),
        eq(classInstances.outcome, "PENDING"),
        lt(classInstances.scheduledEndAt, missedDeadline)
      )
    )
    .limit(limit);
};
