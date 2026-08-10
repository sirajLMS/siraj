import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";

/**
 * Shared upsertMany helper for meeting config repositories.
 *
 * Both user-meeting-config and class-meeting-config have an `upsertMany` method
 * with identical transaction scaffolding — only the "find existing" and
 * "upsert one" strategies differ. This helper accepts those strategies as
 * callbacks and provides the shared loop + transaction wrapper.
 */

export async function runUpsertMany<TInput, TResult>(
  inputs: readonly TInput[],
  findExisting: (input: TInput, tx: DBTransaction) => Promise<{ id: string } | null>,
  upsertOne: (input: TInput, existingId: string | null, tx: DBTransaction, locale?: string) => Promise<TResult>,
  tx?: DBTransaction,
  locale?: string
): Promise<TResult[]> {
  if (inputs.length === 0) return [];

  const run = async (t: DBTransaction): Promise<TResult[]> => {
    return Promise.all(
      inputs.map(async (input) => {
        const existing = await findExisting(input, t);
        const existingId = existing ? existing.id : null;
        return upsertOne(input, existingId, t, locale);
      })
    );
  };

  if (tx) {
    return run(tx);
  }
  return db.transaction(run);
}
