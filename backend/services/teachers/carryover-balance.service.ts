import { db } from "@/backend/db";
import { CarryoverBalanceRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { DomainError, NotFoundError, sanitizePlainText, ValidationError } from "@/backend/lib";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import { pickDominantCurrency } from "@/backend/services/teachers/carryover-aggregate";
import { bulkCreateWithinTransaction } from "@/backend/services/teachers/carryover-balance.bulk-create.helpers";
import {
  REPORT_AGGREGATE_ROW_CAP,
  STUDENTS_TEXT_MAX_LENGTH,
} from "@/backend/services/teachers/carryover-balance.constants";
import {
  bulkDeleteWithinTransaction,
  createManualWithinTransaction,
  deleteWithinTransaction,
  unpayWithinTransaction,
  updateCarryoverWithinTransaction,
} from "@/backend/services/teachers/carryover-balance.crud.helpers";
import { sumAmounts } from "@/backend/services/teachers/carryover-balance.money.helpers";
import {
  countRowsByPaid,
  mapCarryoverRow,
  mapLinkedSessionRow,
  toCarryoverRow,
} from "@/backend/services/teachers/carryover-balance.rows.helpers";
import { bulkToExpenseWithinTransaction } from "@/backend/services/teachers/carryover-balance.settlement.helpers";
import {
  assertCarryoverIdShape,
  assertCarryoverIdsShape,
  assertInstanceIdsShape,
  assertTeacherIdShape,
  normalizePayableAmount,
  sanitizePatchField,
  validatePeriod,
} from "@/backend/services/teachers/carryover-balance.validation.helpers";
import {
  deriveBulkCreateIdempotencyKey,
  deriveBulkToExpenseIdempotencyKey,
  deriveCrudIdempotencyKey,
} from "@/backend/services/teachers/carryover-idempotency";
import type {
  BulkCreateCarryoverInput,
  BulkCreateCarryoverResult,
  BulkDeleteCarryoverInput,
  BulkDeleteCarryoverResult,
  BulkToExpenseInput,
  BulkToExpenseResult,
  CarryoverFilters,
  CarryoverLinkedSession,
  CarryoverPage,
  CarryoverRow,
  CreateCarryoverInput,
  DeleteCarryoverInput,
  DeleteCarryoverResult,
  UnpayCarryoverInput,
  UpdateCarryoverInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace CarryoverBalanceService {
  /**
   * Aggregates audited class instances into one carryover balance per
   * teacher: locks the selected sessions, validates they are audited and
   * unlinked, converts cross-currency amounts into each group's dominant
   * currency, inserts the carryover + item snapshots, links the sessions and
   * moves them to WAITING_PAID, and emits one audit row per created carryover.
   * A same-content re-submit inside the idempotency window replays the
   * originally persisted result.
   */
  export async function bulkCreateCarryoverBalances(
    input: BulkCreateCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<BulkCreateCarryoverResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);

    const instanceIds = [...new Set(input.instanceIds)];
    if (instanceIds.length === 0) {
      throw new ValidationError(tErrors.carryover.noInstances);
    }
    assertInstanceIdsShape(instanceIds, tErrors);
    const note = input.note == null ? null : sanitizePlainText(input.note);
    const idempotencyKey = deriveBulkCreateIdempotencyKey(input);

    return db.transaction(tx => bulkCreateWithinTransaction(tx, input, instanceIds, note, idempotencyKey, tErrors));
  }

  /**
   * Converts one or more unpaid carryovers into expense records in a single
   * transaction: validates the payment/expense dates, locks the carryovers,
   * writes the expense rows, marks the carryovers paid, moves their linked
   * sessions to PAID, and emits one audit row per conversion. A same-content
   * re-submit inside the idempotency window replays the original result.
   */
  export async function bulkCarryoverToExpense(
    input: BulkToExpenseInput,
    tErrors: ErrorsLabels
  ): Promise<BulkToExpenseResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);

    if (!input.paymentDate) {
      throw new DomainError("PAYMENT_DATE_REQUIRED", tErrors.carryover.paymentDateRequired);
    }
    const carryoverIds = [...new Set(input.carryoverIds)];
    if (carryoverIds.length === 0) {
      throw new ValidationError(tErrors.carryover.noCarryovers);
    }
    assertCarryoverIdsShape(carryoverIds, tErrors);
    const expenseDate = input.expenseDate ?? input.paymentDate.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(expenseDate)) {
      throw new DomainError("EXPENSE_DATE_INVALID", tErrors.carryover.expenseDateInvalid);
    }

    const note = input.note == null ? null : sanitizePlainText(input.note);
    const idempotencyKey = deriveBulkToExpenseIdempotencyKey(input);

    return db.transaction(tx =>
      bulkToExpenseWithinTransaction(tx, input, carryoverIds, expenseDate, note, idempotencyKey, tErrors)
    );
  }

  /**
   * Reverts a paid carryover: marks the carryover unpaid under its row lock,
   * soft-deletes the linked expense inside the same transaction, moves its
   * sessions back from PAID to WAITING_PAID, and emits the unpay audit row.
   * The revert lands first because the expense ledger protects rows whose
   * linked carryover is still paid (`EXPENSE_DELETE_VIA_UNPAY`) — unpaying
   * first is what lets the settlement's own soft-delete through. A missing
   * expense row (the reference outlives rows deleted before the ledger
   * shipped, or rows pruned independently) is tolerated: the revert still
   * completes. Any other ledger failure rolls back the whole revert. Calling
   * it on an unpaid carryover rejects — there is nothing to reverse and the
   * original conversion stays the authoritative record.
   */
  export async function unpayCarryoverBalance(
    input: UnpayCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<CarryoverRow> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertCarryoverIdShape(input.id, tErrors);
    const note = input.note == null ? null : sanitizePlainText(input.note);

    return db.transaction(tx => unpayWithinTransaction(tx, input, note, tErrors));
  }

  /**
   * Creates a manual carryover record (no aggregated sessions). Snapshots the
   * teacher's disabled state at creation time. A same-content re-submit inside
   * the idempotency window returns the originally persisted row.
   */
  export async function createCarryoverBalance(
    input: CreateCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<CarryoverRow> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertTeacherIdShape(input.teacherId, tErrors);
    validatePeriod(input.fromDate ?? null, input.toDate ?? null, tErrors);
    const payable = normalizePayableAmount(input.payable, tErrors);
    const note = input.note == null ? null : sanitizePlainText(input.note);
    const studentsText =
      input.studentsText == null ? null : sanitizePlainText(input.studentsText, STUDENTS_TEXT_MAX_LENGTH);
    const idempotencyKey = deriveCrudIdempotencyKey(input);

    return db.transaction(tx =>
      createManualWithinTransaction(tx, input, payable, studentsText, note, idempotencyKey, tErrors)
    );
  }

  /**
   * Updates the editable patch fields of a carryover (period, payable,
   * currency, students summary, note). The teacher is immutable by design —
   * re-assignment requires delete + recreate. A paid carryover is fully
   * read-only: the settled amount and currency must keep matching the
   * persisted settlement (`paid` equals `payable` once `isPaid`), so even
   * metadata edits go through the unpay → correct → re-settle path.
   */
  export async function updateCarryoverBalance(
    input: UpdateCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<CarryoverRow> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertCarryoverIdShape(input.id, tErrors);

    if (Object.hasOwn(input, "teacherId")) {
      throw new DomainError("CARRYOVER_TEACHER_IMMUTABLE", tErrors.carryover.teacherImmutable);
    }
    validatePeriod(input.fromDate ?? null, input.toDate ?? null, tErrors);

    const note = sanitizePatchField(input.note);
    const studentsText = sanitizePatchField(input.studentsText, STUDENTS_TEXT_MAX_LENGTH);
    const payable =
      input.payable === undefined || input.payable === null
        ? undefined
        : normalizePayableAmount(input.payable, tErrors);

    return db.transaction(tx => updateCarryoverWithinTransaction(tx, input, note, studentsText, payable, tErrors));
  }

  /**
   * Hard-deletes one unpaid carryover: linked sessions revert to the status
   * captured in their item snapshots and are detached before the row and its
   * items are removed. Paid carryovers reject — the correction path is unpay.
   */
  export async function deleteCarryoverBalance(
    input: DeleteCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<DeleteCarryoverResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertCarryoverIdShape(input.id, tErrors);

    return db.transaction(tx => deleteWithinTransaction(tx, input, tErrors));
  }

  /**
   * Deletes a batch of carryovers atomically: a single paid row in the
   * selection rejects the whole batch and no rows are removed.
   */
  export async function bulkDeleteCarryoverBalances(
    input: BulkDeleteCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<BulkDeleteCarryoverResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);

    const ids = [...new Set(input.ids)];
    if (ids.length === 0) {
      throw new ValidationError(tErrors.carryover.noCarryovers);
    }
    assertCarryoverIdsShape(ids, tErrors);

    return db.transaction(tx => bulkDeleteWithinTransaction(tx, input, ids, tErrors));
  }

  /**
   * Reads one page of the carryover list plus aggregates describing the full
   * filtered set (bounded by the export ceiling): total payable, total paid,
   * the dominant currency across rows, and the paid/unpaid row counts.
   */
  export async function getReport(
    actorUserId: string,
    filters: CarryoverFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<CarryoverPage> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);

    const page = await CarryoverBalanceRepository.findFiltered(filters, pagination);

    // Aggregates describe the filtered set, not just the requested page; when
    // the whole set already sits on this page no second scan is needed.
    const aggregateRows =
      pagination.offset === 0 && page.totalCount <= pagination.limit
        ? page.rows
        : (
            await CarryoverBalanceRepository.findFiltered(filters, {
              limit: REPORT_AGGREGATE_ROW_CAP,
              offset: 0,
            })
          ).rows;

    return {
      rows: page.rows.map(row =>
        mapCarryoverRow(row, { teacherName: row.teacherName, teacherAvatarUrl: row.teacherAvatarUrl })
      ),
      totalCount: page.totalCount,
      aggregates: {
        totalPayable: sumAmounts(aggregateRows.map(row => row.payable)),
        totalPaid: sumAmounts(aggregateRows.map(row => row.paid)),
        dominantCurrency: pickDominantCurrency(aggregateRows),
        rowCountByPaid: countRowsByPaid(aggregateRows),
      },
    };
  }

  /** Reads a single carryover with the teacher display fields resolved, for the drill-down view. */
  export async function getById(actorUserId: string, id: string, tErrors: ErrorsLabels): Promise<CarryoverRow> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);
    assertCarryoverIdShape(id, tErrors);
    const row = await CarryoverBalanceRepository.getById(id);
    if (row == null) {
      throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(id));
    }
    return toCarryoverRow(row, undefined, tErrors.unknownName);
  }

  /** Sessions aggregated into one carryover, with the link-time amount/status snapshots for the detail drawer. */
  export async function getLinkedSessions(
    actorUserId: string,
    carryoverId: string,
    tErrors: ErrorsLabels
  ): Promise<CarryoverLinkedSession[]> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);
    assertCarryoverIdShape(carryoverId, tErrors);
    const carryover = await CarryoverBalanceRepository.getById(carryoverId);
    if (carryover == null) {
      throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(carryoverId));
    }
    const rows = await CarryoverBalanceRepository.findLinkedSessionRows(carryoverId);
    return rows.map(mapLinkedSessionRow);
  }

  /**
   * Per-carryover linked-session counts for DataLoader-backed field resolution.
   * Field-level batching has no per-item acting user; access is gated on the
   * parent query's carryover view scope instead.
   */
  export async function countLinkedSessionsByCarryoverIds(
    carryoverIds: readonly string[]
  ): Promise<Map<string, number>> {
    return CarryoverBalanceRepository.countLinkedSessionsByCarryoverIds(carryoverIds);
  }
}
