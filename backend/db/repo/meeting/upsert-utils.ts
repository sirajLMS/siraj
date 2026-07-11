import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";

/**
 * Shared `upsertMany` loop used by both ClassMeetingConfigRepository and
 * UserMeetingConfigRepository. Delegates the "find existing" and "create"
 * operations to caller-supplied callbacks so the transaction plumbing and
 * find-or-create control flow are not duplicated.
 */
export async function upsertManyWith<TInput, TResult, TExisting extends { id: string }>(
  inputs: readonly TInput[],
  findExisting: (input: TInput, t: DBTransaction) => Promise<TExisting | null>,
  createOne: (input: TInput, t: DBTransaction, locale?: string) => Promise<TResult>,
  updateOne: (id: string, input: TInput, t: DBTransaction, locale?: string) => Promise<TResult>,
  tx?: DBTransaction,
  locale?: string
): Promise<TResult[]> {
  if (inputs.length === 0) return [];

  const run = async (t: DBTransaction): Promise<TResult[]> => {
    const results: TResult[] = [];

    for (const input of inputs) {
      const existing = await findExisting(input, t);

      if (existing) {
        const updated = await updateOne(existing.id, input, t, locale);
        results.push(updated);
      } else {
        results.push(await createOne(input, t, locale));
      }
    }

    return results;
  };

  if (tx) {
    return run(tx);
  }
  return db.transaction(run);
}
