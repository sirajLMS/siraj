import { and, eq, isNull, lt } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances } from "@/backend/db/schema";
import type * as Types from "@/backend/types";

export const findExpiredPendingInstances = async (
  graceMinutes: number,
  limit: number,
  now: Date,
  tx?: DBTransaction
): Promise<Types.ClassInstanceEntity[]> => {
  const queryDb = tx ?? db;
  const missedDeadline = new Date(now.getTime() - graceMinutes * 60_000);

  return queryDb
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
