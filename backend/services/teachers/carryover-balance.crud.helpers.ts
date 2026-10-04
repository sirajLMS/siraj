import { CarryoverBalanceRepository, TeacherRepository } from "@/backend/db/repo";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { CalculationStatus } from "@/backend/enum";
import { DomainError, logger, NotFoundError } from "@/backend/lib";
import {
  CARRYOVER_ACTION_CREATE,
  CARRYOVER_ACTION_UNPAID,
  CARRYOVER_AUDIT_ENTITY_TYPE,
  ZERO_AMOUNT,
} from "@/backend/services/teachers/carryover-balance.constants";
import {
  emitCarryoverAuditLog,
  findReplayAuditLogs,
} from "@/backend/services/teachers/carryover-balance.replay.helpers";
import { toCarryoverRow } from "@/backend/services/teachers/carryover-balance.rows.helpers";
import { forEachInSequence } from "@/backend/services/teachers/carryover-balance.sequence.helpers";
import {
  deleteCarryoverRowWithAudit,
  revertAndUnlinkCarryoverSessions,
  transitionSessions,
} from "@/backend/services/teachers/carryover-balance.sessions.helpers";
import { softDeleteSettledExpense } from "@/backend/services/teachers/carryover-balance.settlement.helpers";
import {
  assertAllCarryoversFound,
  verifyCarryoverDeletable,
} from "@/backend/services/teachers/carryover-balance.validation.helpers";
import type {
  BulkDeleteCarryoverInput,
  BulkDeleteCarryoverResult,
  CarryoverRow,
  CreateCarryoverInput,
  DBTransaction,
  DeleteCarryoverInput,
  DeleteCarryoverResult,
  UnpayCarryoverInput,
  UpdateCarryoverInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Persists a manual carryover row plus its creation audit log and maps the stored row for the caller. */
async function insertManualCarryover(
  tx: DBTransaction,
  input: CreateCarryoverInput,
  prepared: { payable: string; studentsText: string | null; note: string | null; idempotencyKey: string },
  tErrors: ErrorsLabels
): Promise<CarryoverRow> {
  const teacher = await TeacherRepository.findById(input.teacherId, tx);
  if (teacher == null) {
    throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(input.teacherId));
  }
  const isDisabledTeacher = await TeacherRepository.isDisabled(input.teacherId, tx);

  const created = await CarryoverBalanceRepository.create(
    {
      teacherId: input.teacherId,
      studentsCount: input.studentsCount ?? null,
      studentsText: prepared.studentsText,
      totalDuration: null,
      payable: prepared.payable,
      teacherCurrency: input.teacherCurrency,
      paid: ZERO_AMOUNT,
      fromDate: input.fromDate ?? null,
      toDate: input.toDate ?? null,
      paymentDate: null,
      isDisabledTeacher,
      isPaid: false,
      expenseId: null,
      note: prepared.note,
      createdByUserId: input.actorUserId,
    },
    tx
  );

  await emitCarryoverAuditLog(tx, {
    actorUserId: input.actorUserId,
    actorType: "USER",
    entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
    entityId: created.id,
    action: CARRYOVER_ACTION_CREATE,
    metadata: {
      idempotencyKey: prepared.idempotencyKey,
      teacherId: created.teacherId,
      instanceIds: [],
      studentsCount: created.studentsCount,
      totalDuration: created.totalDuration,
      payable: created.payable,
      currency: created.teacherCurrency,
    },
  });

  logger.info("Manual carryover created", {
    actorUserId: input.actorUserId,
    carryoverId: created.id,
    teacherId: created.teacherId,
    payable: created.payable,
  });
  return toCarryoverRow(created, tx, tErrors.unknownName);
}

/** Runs the manual-create transaction body, replaying the originally persisted row for an in-window re-submit. */
export async function createManualWithinTransaction(
  tx: DBTransaction,
  input: CreateCarryoverInput,
  payable: string,
  studentsText: string | null,
  note: string | null,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<CarryoverRow> {
  await acquireAdvisoryLock(tx, `carryover-create:${idempotencyKey}`);

  const replayLogs = await findReplayAuditLogs(tx, input.actorUserId, CARRYOVER_ACTION_CREATE, idempotencyKey);
  const replayCarryoverId = replayLogs[0]?.entityId;
  if (replayCarryoverId != null) {
    const existing = await CarryoverBalanceRepository.getById(replayCarryoverId, tx);
    if (existing != null) return toCarryoverRow(existing, tx, tErrors.unknownName);
  }

  return insertManualCarryover(tx, input, { payable, studentsText, note, idempotencyKey }, tErrors);
}

/**
 * Runs the update transaction body: locks the row, rejects paid carryovers,
 * applies the patch, and emits the update audit row.
 */
export async function updateCarryoverWithinTransaction(
  tx: DBTransaction,
  input: UpdateCarryoverInput,
  note: string | null | undefined,
  studentsText: string | null | undefined,
  payable: string | undefined,
  tErrors: ErrorsLabels
): Promise<CarryoverRow> {
  const [existing] = await CarryoverBalanceRepository.getByIdsForUpdate([input.id], tx);
  if (existing == null) {
    throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
  }
  if (existing.isPaid) {
    throw new DomainError("CARRYOVER_PAID_CANNOT_EDIT", tErrors.carryover.paidCannotEdit);
  }

  const updated = await CarryoverBalanceRepository.update(
    input.id,
    {
      fromDate: input.fromDate,
      toDate: input.toDate,
      payable,
      teacherCurrency: input.teacherCurrency ?? undefined,
      studentsCount: input.studentsCount,
      studentsText,
      note,
    },
    tx
  );
  if (updated == null) {
    throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
  }

  await emitCarryoverAuditLog(tx, {
    actorUserId: input.actorUserId,
    actorType: "USER",
    entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
    entityId: input.id,
    action: "UPDATE",
    previousState: {
      fromDate: existing.fromDate,
      toDate: existing.toDate,
      payable: existing.payable,
      teacherCurrency: existing.teacherCurrency,
      studentsCount: existing.studentsCount,
      studentsText: existing.studentsText,
      note: existing.note,
    },
    newState: {
      fromDate: updated.fromDate,
      toDate: updated.toDate,
      payable: updated.payable,
      teacherCurrency: updated.teacherCurrency,
      studentsCount: updated.studentsCount,
      studentsText: updated.studentsText,
      note: updated.note,
    },
  });

  logger.info("Carryover updated", { actorUserId: input.actorUserId, carryoverId: input.id });
  return toCarryoverRow(updated, tx, tErrors.unknownName);
}

/**
 * Runs the unpay transaction body: marks the carryover unpaid, soft-deletes
 * the linked expense, moves its sessions back to WAITING_PAID, and emits the
 * unpay audit row.
 */
export async function unpayWithinTransaction(
  tx: DBTransaction,
  input: UnpayCarryoverInput,
  note: string | null,
  tErrors: ErrorsLabels
): Promise<CarryoverRow> {
  const [carryover] = await CarryoverBalanceRepository.getByIdsForUpdate([input.id], tx);
  if (carryover == null) {
    throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
  }
  if (!carryover.isPaid) {
    throw new DomainError("CARRYOVER_NOT_PAID", tErrors.carryover.notPaid);
  }
  const settledExpenseId = carryover.expenseId;

  const updated = await CarryoverBalanceRepository.update(
    input.id,
    { isPaid: false, paid: ZERO_AMOUNT, paymentDate: null, expenseId: null, paidAt: null, paidByUserId: null },
    tx
  );
  if (updated == null) {
    throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
  }

  if (settledExpenseId != null) {
    await softDeleteSettledExpense(tx, settledExpenseId, input.actorUserId, note, tErrors);
  }

  const linkedSessions = await CarryoverBalanceRepository.findLinkedSessions(input.id, tx, { forUpdate: true });
  await transitionSessions(
    tx,
    linkedSessions.map(instance => ({
      instanceId: instance.id,
      fromStatus: instance.calculationStatus,
      toStatus: CalculationStatus.WAITING_PAID,
      teacherPaidAmount: instance.teacherPaidAmount ?? null,
      isPartialPercentage: null,
    })),
    `Carryover ${input.id} unpaid`,
    input.actorUserId
  );

  await emitCarryoverAuditLog(tx, {
    actorUserId: input.actorUserId,
    actorType: "USER",
    entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
    entityId: input.id,
    action: CARRYOVER_ACTION_UNPAID,
    metadata: { expenseId: settledExpenseId, reason: note },
  });

  logger.info("Carryover unpaid", {
    actorUserId: input.actorUserId,
    carryoverId: input.id,
    expenseId: settledExpenseId,
    sessionCount: linkedSessions.length,
  });
  return toCarryoverRow(updated, tx, tErrors.unknownName);
}

/** Runs the single-delete transaction body: reverts + detaches sessions, then removes the row and its items. */
export async function deleteWithinTransaction(
  tx: DBTransaction,
  input: DeleteCarryoverInput,
  tErrors: ErrorsLabels
): Promise<DeleteCarryoverResult> {
  const carryover = await verifyCarryoverDeletable(tx, input.id, tErrors);
  const reverted = await revertAndUnlinkCarryoverSessions(tx, carryover, input.actorUserId, tErrors);
  await deleteCarryoverRowWithAudit(tx, carryover, input.actorUserId);

  logger.info("Carryover deleted", {
    actorUserId: input.actorUserId,
    carryoverId: input.id,
    teacherId: carryover.teacherId,
    revertedSessions: reverted,
  });
  return { id: input.id, deleted: true };
}

/** Runs the bulk-delete transaction body: a single paid row rejects the whole batch. */
export async function bulkDeleteWithinTransaction(
  tx: DBTransaction,
  input: BulkDeleteCarryoverInput,
  ids: readonly string[],
  tErrors: ErrorsLabels
): Promise<BulkDeleteCarryoverResult> {
  const carryovers = await CarryoverBalanceRepository.getByIdsForUpdate([...ids], tx);
  assertAllCarryoversFound(carryovers, ids, tErrors);
  for (const carryover of carryovers) {
    if (carryover.isPaid) {
      throw new DomainError("CARRYOVER_PAID_CANNOT_DELETE", tErrors.carryover.paidCannotDelete);
    }
  }

  const auditLogIds: string[] = [];
  let revertedSessions = 0;
  await forEachInSequence(carryovers, async carryover => {
    revertedSessions += await revertAndUnlinkCarryoverSessions(tx, carryover, input.actorUserId, tErrors);
    const auditLogId = await deleteCarryoverRowWithAudit(tx, carryover, input.actorUserId);
    if (auditLogId != null) auditLogIds.push(auditLogId);
  });

  logger.info("Carryovers deleted", {
    actorUserId: input.actorUserId,
    carryoverCount: carryovers.length,
    revertedSessions,
  });
  return { deletedIds: [...ids], auditLogIds };
}
