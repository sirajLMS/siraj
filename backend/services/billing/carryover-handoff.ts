import { type SQL, sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db/dialect";
import { logger } from "@/backend/lib";
import type { DBTransaction } from "@/backend/types";

/** Carryover payouts table, created and owned by the teacher-carryover module. */
const CARRYOVER_BALANCES_TABLE = "teacher_carryover_balances";

/** Carryover entry handed off from a credit-adjustment ledger row. */
export interface CarryoverHandoffPayload {
  creditTransactionId: string;
  teacherId: string;
  studentId: string;
  /** ISO date strings (YYYY-MM-DD). */
  fromDate: string;
  toDate: string;
  paymentDate: string;
  hours: number;
  approvedByUserId: string;
}

interface ExecutableTx {
  execute(query: SQL): Promise<unknown>;
}

function isExecutableTx(tx: unknown): tx is ExecutableTx {
  return typeof tx === "object" && tx !== null && "execute" in tx && typeof tx.execute === "function";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Normalizes driver-specific raw-query results (`{ rows }` vs plain array). */
function extractRows(result: unknown): Record<string, unknown>[] {
  const raw = isRecord(result) && "rows" in result ? result.rows : result;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecord);
}

async function carryoverBalancesTableExists(tx: ExecutableTx): Promise<boolean> {
  const result = await tx.execute(sql`SELECT to_regclass(${CARRYOVER_BALANCES_TABLE}) AS name`);
  const tableName = extractRows(result)[0]?.name;
  return typeof tableName === "string" && tableName.length > 0;
}

/**
 * Mirrors a subtract-with-carryover adjustment into the carryover payouts
 * table when that table exists. Until the payouts module ships, the carryover
 * metadata columns on the credit ledger row are the source of truth and this
 * is a no-op.
 */
export async function maybeInsertCarryoverBalanceEntry(
  tx: DBTransaction,
  payload: CarryoverHandoffPayload
): Promise<void> {
  if (isSqlite() || !isExecutableTx(tx)) return;
  if (!(await carryoverBalancesTableExists(tx))) return;

  await tx.execute(sql`
    INSERT INTO ${sql.identifier(CARRYOVER_BALANCES_TABLE)}
      (credit_transaction_id, teacher_id, student_id, from_date, to_date, payment_date, hours, status, created_at)
    VALUES (
      ${payload.creditTransactionId},
      ${payload.teacherId},
      ${payload.studentId},
      ${payload.fromDate},
      ${payload.toDate},
      ${payload.paymentDate},
      ${payload.hours},
      'PENDING',
      now()
    )
  `);

  logger.debug("Carryover balance entry handed off", {
    creditTransactionId: payload.creditTransactionId,
    teacherId: payload.teacherId,
    studentId: payload.studentId,
    hours: payload.hours,
  });
}
