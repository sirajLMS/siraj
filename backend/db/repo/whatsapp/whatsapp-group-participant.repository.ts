import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { whatsappGroupParticipants } from "@/backend/db/schema";
import type {
  DBTransaction,
  WhatsappGroupParticipantInsertType,
  WhatsappGroupParticipantSelectType,
} from "@/backend/types";

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

export namespace WhatsappGroupParticipantRepository {
  /**
   * Idempotent participant upsert keyed on (groupId, waId) — a participant's
   * WhatsApp ID is unique per group, so syncs and join/leave webhook events
   * upsert on it instead of duplicating rows.
   */
  export async function upsertByWaId(
    input: WhatsappGroupParticipantInsertType,
    tx?: DBTransaction
  ): Promise<WhatsappGroupParticipantSelectType> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .insert(whatsappGroupParticipants)
        .values(input)
        .onConflictDoUpdate({
          target: [whatsappGroupParticipants.groupId, whatsappGroupParticipants.waId],
          set: { joinedAt: input.joinedAt ?? null, addedVia: input.addedVia ?? null },
        })
        .returning();
      return row;
    };
    return runWithTx(runner, tx);
  }

  /**
   * Remove one participant by (groupId, waId). Returns `false` when the
   * membership does not exist.
   */
  export async function removeByWaId(groupId: string, waId: string, tx?: DBTransaction): Promise<boolean> {
    const runner = async (t: DBTransaction) => {
      const rows = await t
        .delete(whatsappGroupParticipants)
        .where(and(eq(whatsappGroupParticipants.groupId, groupId), eq(whatsappGroupParticipants.waId, waId)))
        .returning({ id: whatsappGroupParticipants.id });
      return rows.length > 0;
    };
    return runWithTx(runner, tx);
  }

  /**
   * All participants of one group, oldest-joined first. Groups are bounded
   * by Meta's participant limits, so the list is returned unpaginated.
   */
  export async function listByGroup(
    groupId: string,
    tx?: DBTransaction
  ): Promise<WhatsappGroupParticipantSelectType[]> {
    const q = queryDb(tx);
    return q
      .select()
      .from(whatsappGroupParticipants)
      .where(eq(whatsappGroupParticipants.groupId, groupId))
      .orderBy(asc(whatsappGroupParticipants.joinedAt));
  }

  /** Count of participants in one group (pair for `listByGroup`). */
  export async function countByGroup(groupId: string, tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const rows = await q
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappGroupParticipants)
      .where(eq(whatsappGroupParticipants.groupId, groupId));
    return rows[0]?.value ?? 0;
  }

  /**
   * Batch lookup by (groupId, waId) pairs (DataLoader). Pre-initializes the
   * map with every requested key mapped to `null` so callers can distinguish
   * missing memberships.
   */
  export async function findByGroupAndWaIds(
    groupId: string,
    waIds: string[],
    tx?: DBTransaction
  ): Promise<Map<string, WhatsappGroupParticipantSelectType | null>> {
    const result = new Map<string, WhatsappGroupParticipantSelectType | null>();
    for (const waId of waIds) {
      result.set(waId, null);
    }
    if (waIds.length === 0) {
      return result;
    }
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(whatsappGroupParticipants)
      .where(and(eq(whatsappGroupParticipants.groupId, groupId), inArray(whatsappGroupParticipants.waId, waIds)));
    for (const row of rows) {
      result.set(row.waId, row);
    }
    return result;
  }
}
