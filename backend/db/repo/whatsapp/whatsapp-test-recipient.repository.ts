import { and, asc, eq, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { whatsappTestRecipients } from "@/backend/db/schema";
import { WhatsappTestRecipientStatus } from "@/backend/enum/whatsapp";
import type {
  DBTransaction,
  WhatsappTestRecipientInsertType,
  WhatsappTestRecipientReturnType,
  WhatsappTestRecipientSelectType,
} from "@/backend/types";

type CreateTestRecipientInput = Pick<
  WhatsappTestRecipientInsertType,
  "accountId" | "phoneNumber" | "note" | "createdByUserId"
>;

interface RecordVerifyInput {
  readonly allowed: boolean;
  readonly errorCode: string | null;
  readonly checkedAt: Date;
}

/** Type guard: does `value` match a known `WhatsappTestRecipientStatus` member? */
function isValidTestRecipientStatus(value: string): value is WhatsappTestRecipientStatus {
  return (Object.values(WhatsappTestRecipientStatus) as string[]).includes(value);
}

/**
 * Re-apply enum typing to the raw `status` varchar. The column is written
 * only by this module (insert default or `recordVerify`), so unknown values
 * fall back to PENDING rather than escaping to callers.
 */
function toReturnType(row: WhatsappTestRecipientSelectType): WhatsappTestRecipientReturnType {
  const status = isValidTestRecipientStatus(row.status) ? row.status : WhatsappTestRecipientStatus.PENDING;
  return { ...row, status };
}

/**
 * Runs a transactional or bare operation depending on whether `tx` is provided.
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

export namespace WhatsappTestRecipientRepository {
  /** All registry rows for an account, oldest first. */
  export async function listByAccountId(
    accountId: string,
    tx?: DBTransaction
  ): Promise<WhatsappTestRecipientReturnType[]> {
    const rows = await queryDb(tx)
      .select()
      .from(whatsappTestRecipients)
      .where(eq(whatsappTestRecipients.accountId, accountId))
      .orderBy(asc(whatsappTestRecipients.createdAt), asc(whatsappTestRecipients.id));
    return rows.map(toReturnType);
  }

  /** Single row by primary key, or null when unknown. */
  export async function findById(id: string, tx?: DBTransaction): Promise<WhatsappTestRecipientReturnType | null> {
    const rows = await queryDb(tx)
      .select()
      .from(whatsappTestRecipients)
      .where(eq(whatsappTestRecipients.id, id))
      .limit(1);
    return rows[0] ? toReturnType(rows[0]) : null;
  }

  /** Single row for the (accountId, phoneNumber) unique key, or null. */
  export async function findByAccountAndPhone(
    accountId: string,
    phoneNumber: string,
    tx?: DBTransaction
  ): Promise<WhatsappTestRecipientReturnType | null> {
    const rows = await queryDb(tx)
      .select()
      .from(whatsappTestRecipients)
      .where(and(eq(whatsappTestRecipients.accountId, accountId), eq(whatsappTestRecipients.phoneNumber, phoneNumber)))
      .limit(1);
    return rows[0] ? toReturnType(rows[0]) : null;
  }

  /** Number of registry rows for an account (service enforces the cap). */
  export async function countByAccountId(accountId: string, tx?: DBTransaction): Promise<number> {
    const rows = await queryDb(tx)
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(whatsappTestRecipients)
      .where(eq(whatsappTestRecipients.accountId, accountId));
    return rows[0]?.count ?? 0;
  }

  /**
   * Insert a new recipient row in PENDING status. The
   * `(accountId, phoneNumber)` unique index rejects duplicates at the driver
   * level; callers translate that into a domain error.
   */
  export async function create(
    input: CreateTestRecipientInput,
    tx?: DBTransaction
  ): Promise<WhatsappTestRecipientReturnType> {
    const runner = async (t: DBTransaction) => {
      const [row] = await t
        .insert(whatsappTestRecipients)
        .values({ ...input, note: input.note ?? null })
        .returning();
      return row ?? raiseInsertLoss();
    };
    return toReturnType(await runWithTx(runner, tx));
  }

  /** Hard delete by id; returns the removed row, or null when id is unknown. */
  export async function deleteById(id: string, tx?: DBTransaction): Promise<WhatsappTestRecipientReturnType | null> {
    const runner = async (t: DBTransaction) =>
      t.delete(whatsappTestRecipients).where(eq(whatsappTestRecipients.id, id)).returning();
    const [row] = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }

  /**
   * Record the outcome of a hello_world verify test-send: `allowed` flips the
   * row between PENDING and ALLOWED, and Meta's error code (e.g. "131030") is
   * kept for operator diagnostics. Returns null when the id is unknown.
   */
  export async function recordVerify(
    id: string,
    input: RecordVerifyInput,
    tx?: DBTransaction
  ): Promise<WhatsappTestRecipientReturnType | null> {
    const runner = async (t: DBTransaction) =>
      t
        .update(whatsappTestRecipients)
        .set({
          status: input.allowed ? WhatsappTestRecipientStatus.ALLOWED : WhatsappTestRecipientStatus.PENDING,
          lastCheckedAt: input.checkedAt,
          lastErrorCode: input.errorCode,
        })
        .where(eq(whatsappTestRecipients.id, id))
        .returning();
    const [row] = await runWithTx(runner, tx);
    return row ? toReturnType(row) : null;
  }
}

/** Invariant breach: an unconditional insert returned no row. */
function raiseInsertLoss(): never {
  throw new Error("whatsapp test recipient insert returned no row");
}
