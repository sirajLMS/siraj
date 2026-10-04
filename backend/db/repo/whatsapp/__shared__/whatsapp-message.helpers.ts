import { db } from "@/backend/db";
import type { WhatsappMessageDirection } from "@/backend/enum";
import { coerceJsonRecord, coerceMessageDirection } from "@/backend/lib";
import type { DBTransaction } from "@/backend/types";

/**
 * Map a raw WhatsApp message row (conversation or group message) to the
 * client-facing shape: `direction` re-applied with enum typing and `content`
 * narrowed to a plain record.
 */
export function toWhatsappMessageReturnType<Select extends { direction: string; content: unknown }>(
  row: Select
): Omit<Select, "direction" | "content"> & { direction: WhatsappMessageDirection; content: Record<string, unknown> } {
  return {
    ...row,
    direction: coerceMessageDirection(row.direction),
    content: coerceJsonRecord(row.content),
  };
}

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
export async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Shared single-mutation `updateByWamid` wrapper for the WhatsApp message
 * repositories: runs the table-specific update runner in a transactional or
 * bare operation and maps the updated row to the table's client-facing
 * ReturnType (`null` when the message is not ingested yet).
 */
export async function updateByWamidReturning<TSelect extends { wamid: string }, TReturn>(
  runner: (t: DBTransaction) => Promise<TSelect | undefined>,
  toReturnType: (row: TSelect) => TReturn,
  tx?: DBTransaction
): Promise<TReturn | null> {
  const row = await runWithTx(runner, tx);
  return row ? toReturnType(row) : null;
}
