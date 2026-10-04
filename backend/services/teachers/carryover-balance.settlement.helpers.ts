import { CarryoverBalanceRepository } from "@/backend/db/repo";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { CalculationStatus, ExpenseType } from "@/backend/enum";
import { DomainError, logger } from "@/backend/lib";
import { ExpenseService } from "@/backend/services";
import {
  CARRYOVER_ACTION_TO_EXPENSE,
  CARRYOVER_AUDIT_ENTITY_TYPE,
} from "@/backend/services/teachers/carryover-balance.constants";
import { sumAmounts } from "@/backend/services/teachers/carryover-balance.money.helpers";
import {
  emitCarryoverAuditLog,
  findReplayAuditLogs,
  parseReplayExpenseItem,
} from "@/backend/services/teachers/carryover-balance.replay.helpers";
import { resolveTeacherDisplay } from "@/backend/services/teachers/carryover-balance.rows.helpers";
import { forEachInSequence } from "@/backend/services/teachers/carryover-balance.sequence.helpers";
import { transitionSessions } from "@/backend/services/teachers/carryover-balance.sessions.helpers";
import {
  assertAllCarryoversFound,
  assertAllCarryoversUnpaid,
} from "@/backend/services/teachers/carryover-balance.validation.helpers";
import type {
  AuditLogReturnType,
  BulkToExpenseInput,
  BulkToExpenseItemResult,
  BulkToExpenseResult,
  CarryoverBalanceSelectType,
  DBTransaction,
  SettlementContext,
  SettlementOutcome,
} from "@/backend/types";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses/expense-source.constants";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * The expense ledger (`ExpenseService`) owns the canonical `expenses` write
 * path: the settlement flow creates one row per carryover through
 * `createInternal` inside its own transaction, and the unpay flow soft-deletes
 * that row through `softDelete` inside the same transaction. The ledger's 60 s
 * replay window keys on `clientRequestId`, so the seed composes the bulk
 * settlement key with the carryover id — a same-window retry of an individual
 * conversion returns the originally persisted expense instead of a duplicate.
 */
function deriveExpenseClientRequestId(idempotencyKey: string, carryoverId: string): string {
  return `carryover-to-expense:${idempotencyKey}:${carryoverId}`;
}

/** Rebuilds the original conversion result from the persisted audit rows. */
function reconstructToExpense(logs: readonly AuditLogReturnType[]): BulkToExpenseResult | null {
  if (logs.length === 0) return null;
  const items: BulkToExpenseItemResult[] = [];
  const auditLogIds: string[] = [];
  for (const log of logs.toReversed()) {
    const item = parseReplayExpenseItem(log);
    if (item == null) return null;
    items.push(item);
    auditLogIds.push(log.id);
  }
  return { items, auditLogIds };
}

/**
 * Writes the expense row for one carryover through the expense ledger inside
 * the caller's transaction, keyed so a same-window retry replays the
 * originally persisted expense. A ledger failure rejects with the domain
 * error so the whole batch rolls back without partial settlement.
 */
async function requestExpenseRecord(
  tx: DBTransaction,
  carryover: CarryoverBalanceSelectType,
  teacherName: string,
  context: SettlementContext,
  tErrors: ErrorsLabels
): Promise<string> {
  try {
    const expense = await ExpenseService.createInternal(
      {
        teacherId: carryover.teacherId,
        teacherName,
        title: `Teacher payout — ${carryover.fromDate ?? "?"} to ${carryover.toDate ?? "?"}`,
        type: ExpenseType.SALARIES,
        expenseValue: carryover.payable,
        expenseCurrency: carryover.teacherCurrency,
        paymentDate: context.paymentDate,
        expenseDate: context.expenseDate,
        note: context.note,
        sourceEntity: EXPENSE_SOURCE_CARRYOVER_BALANCES,
        sourceEntityId: carryover.id,
        createdByUserId: context.actorUserId,
        clientRequestId: deriveExpenseClientRequestId(context.idempotencyKey, carryover.id),
      },
      tx,
      tErrors
    );
    return expense.id;
  } catch (error) {
    throw new DomainError("CARRYOVER_TO_EXPENSE_FAILED", tErrors.carryover.toExpenseFailed, { cause: error });
  }
}

/** Marks the carryover paid and moves its linked sessions to PAID. */
async function markCarryoverPaidAndSettleSessions(
  tx: DBTransaction,
  carryover: CarryoverBalanceSelectType,
  expenseId: string,
  context: SettlementContext,
  tErrors: ErrorsLabels
): Promise<void> {
  const updated = await CarryoverBalanceRepository.update(
    carryover.id,
    {
      isPaid: true,
      paid: carryover.payable,
      paymentDate: context.paymentDate,
      expenseId,
      paidAt: new Date(),
      paidByUserId: context.actorUserId,
    },
    tx
  );
  if (updated == null) {
    throw new DomainError("CARRYOVER_TO_EXPENSE_FAILED", tErrors.carryover.toExpenseFailed);
  }

  const linkedSessions = await CarryoverBalanceRepository.findLinkedSessions(carryover.id, tx, { forUpdate: true });
  await transitionSessions(
    tx,
    linkedSessions.map(instance => ({
      instanceId: instance.id,
      fromStatus: instance.calculationStatus,
      toStatus: CalculationStatus.PAID,
      teacherPaidAmount: instance.teacherPaidAmount ?? null,
      isPartialPercentage: null,
    })),
    `Settled via expense ${expenseId}`,
    context.actorUserId
  );
}

/**
 * Converts one locked, unpaid carryover into an expense: creates the expense
 * record, marks the carryover paid, moves its linked sessions to PAID, and
 * emits the conversion audit row. Any failure rolls back the whole batch.
 */
async function settleCarryoverAsExpense(
  tx: DBTransaction,
  carryover: CarryoverBalanceSelectType,
  context: SettlementContext,
  tErrors: ErrorsLabels
): Promise<SettlementOutcome> {
  const display = await resolveTeacherDisplay(carryover.teacherId, tx, tErrors.unknownName);
  const expenseId = await requestExpenseRecord(tx, carryover, display.teacherName, context, tErrors);
  await markCarryoverPaidAndSettleSessions(tx, carryover, expenseId, context, tErrors);

  const auditLogId = await emitCarryoverAuditLog(tx, {
    actorUserId: context.actorUserId,
    actorType: "USER",
    entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
    entityId: carryover.id,
    action: CARRYOVER_ACTION_TO_EXPENSE,
    metadata: {
      idempotencyKey: context.idempotencyKey,
      expenseId,
      paymentDate: context.paymentDate,
      expenseDate: context.expenseDate,
      amount: carryover.payable,
      currency: carryover.teacherCurrency,
    },
  });

  return {
    item: { carryoverId: carryover.id, expenseId, amount: carryover.payable, currency: carryover.teacherCurrency },
    auditLogId,
  };
}

/**
 * Soft-deletes the expense the settlement wrote, inside the caller's
 * transaction and without a second permission check (the caller owns both).
 * Re-running after the row is gone — because it was already deleted or
 * because the reference predates the ledger and no row ever materialized —
 * is tolerated instead of aborting the revert.
 */
export async function softDeleteSettledExpense(
  tx: DBTransaction,
  expenseId: string,
  actorUserId: string,
  reason: string | null,
  tErrors: ErrorsLabels
): Promise<void> {
  try {
    await ExpenseService.softDelete({ id: expenseId, actorUserId, reason, tx }, tErrors);
  } catch (error) {
    if (error instanceof DomainError && error.code === "EXPENSE_NOT_FOUND") {
      logger.info("Carryover unpay: expense reference has no ledger row; continuing the revert", {
        expenseId,
        actorUserId,
      });
      return;
    }
    throw error;
  }
}

/**
 * Runs the bulk-to-expense transaction body: locks the carryovers, writes the
 * expense rows, marks the carryovers paid, moves their linked sessions to
 * PAID, and emits one audit row per conversion. A same-content re-submit
 * inside the idempotency window replays the original result.
 */
export async function bulkToExpenseWithinTransaction(
  tx: DBTransaction,
  input: BulkToExpenseInput,
  carryoverIds: readonly string[],
  expenseDate: string,
  note: string | null,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<BulkToExpenseResult> {
  await acquireAdvisoryLock(tx, `carryover-to-expense:${idempotencyKey}`);

  const replayLogs = await findReplayAuditLogs(tx, input.actorUserId, CARRYOVER_ACTION_TO_EXPENSE, idempotencyKey);
  const replayed = reconstructToExpense(replayLogs);
  if (replayed) return replayed;

  const carryovers = await CarryoverBalanceRepository.getByIdsForUpdate([...carryoverIds], tx);
  assertAllCarryoversFound(carryovers, carryoverIds, tErrors);
  assertAllCarryoversUnpaid(carryovers, tErrors);

  const items: BulkToExpenseItemResult[] = [];
  const auditLogIds: string[] = [];
  const context: SettlementContext = {
    paymentDate: input.paymentDate,
    expenseDate,
    note,
    actorUserId: input.actorUserId,
    idempotencyKey,
  };
  await forEachInSequence(carryovers, async carryover => {
    const outcome = await settleCarryoverAsExpense(tx, carryover, context, tErrors);
    items.push(outcome.item);
    if (outcome.auditLogId != null) auditLogIds.push(outcome.auditLogId);
  });

  logger.info("Carryovers converted to expenses", {
    actorUserId: input.actorUserId,
    carryoverCount: items.length,
    totalAmount: sumAmounts(items.map(item => item.amount)),
  });
  return { items, auditLogIds };
}
