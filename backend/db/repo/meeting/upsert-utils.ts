import { db } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

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
  tx?: DBTransaction
): Promise<TResult[]> {
  if (inputs.length === 0) return [];

  const run = async (t: DBTransaction): Promise<TResult[]> => {
    const processOne = async (index: number, acc: TResult[]): Promise<TResult[]> => {
      if (index >= inputs.length) return acc;
      const input = inputs[index];
      const existing = await findExisting(input, t);
      if (existing) {
        const updated = await updateOne(existing.id, input, t, tErrors);
        return processOne(index + 1, [...acc, updated]);
      }
      const created = await createOne(input, t, tErrors);
      return processOne(index + 1, [...acc, created]);
    };

    return processOne(0, []);
  };

  if (tx) {
    return run(tx);
  }
  return db.transaction(run);
}
