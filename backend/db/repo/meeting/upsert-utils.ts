import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

/**
 * Shared `upsertMany` loop used by both ClassMeetingConfigRepository and
 * UserMeetingConfigRepository. Delegates the "find existing" and "create"
 * operations to caller-supplied callbacks so the transaction plumbing and
 * find-or-create control flow are not duplicated.
 */
export async function upsertManyWith<TInput, TResult, TExisting extends { id: string }>(
  inputs: readonly TInput[],
  findExisting: (input: TInput, t: DBTransaction) => Promise<TExisting | null>,
  createOne: (input: TInput, t: DBTransaction, tErrors: ErrorsLabels) => Promise<TResult>,
  updateOne: (id: string, input: TInput, t: DBTransaction, tErrors: ErrorsLabels) => Promise<TResult>,
  tErrors: ErrorsLabels,
  tx?: DBTransaction,
): Promise<TResult[]> {
  if (inputs.length === 0) return [];

  const run = async (t: DBTransaction): Promise<TResult[]> => {
    const results: TResult[] = [];

    for (const input of inputs) {
      const existing = await findExisting(input, t);

      if (existing) {
        const updated = await updateOne(existing.id, input, t, tErrors);
        results.push(updated);
      } else {
        results.push(await createOne(input, t, tErrors));
      }
    }

    return results;
  };

  if (tx) {
    return run(tx);
  }
  return db.transaction(run);
}
