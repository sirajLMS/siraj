import { eq } from "drizzle-orm";
import { CarryoverBalanceRepository } from "@/backend/db/repo";
import { ClassStatusEventsRepository, SchedulingRepository } from "@/backend/db/repo/scheduling";
import { carryoverBalanceItems } from "@/backend/db/schema";
import { CalculationStatus } from "@/backend/enum";
import { DomainError } from "@/backend/lib";
import {
  CALCULATION_STATUS_BY_VALUE,
  CARRYOVER_ACTION_DELETE,
  CARRYOVER_AUDIT_ENTITY_TYPE,
  PAYROLL_STATUS_TRANSITION_EVENT_TYPE,
} from "@/backend/services/teachers/carryover-balance.constants";
import { emitCarryoverAuditLog } from "@/backend/services/teachers/carryover-balance.replay.helpers";
import { forEachInSequence } from "@/backend/services/teachers/carryover-balance.sequence.helpers";
import type {
  CarryoverBalanceItemSelectType,
  CarryoverBalanceSelectType,
  ClassStatusEventSeedInsertInput,
  DBTransaction,
  SessionStatusTransition,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

function buildTransitionEvent(
  transition: SessionStatusTransition,
  description: string,
  actorUserId: string
): ClassStatusEventSeedInsertInput {
  return {
    classInstanceId: transition.instanceId,
    eventType: PAYROLL_STATUS_TRANSITION_EVENT_TYPE,
    fromState: { calculationStatus: transition.fromStatus, teacherPaidAmount: transition.teacherPaidAmount },
    toState: { calculationStatus: transition.toStatus },
    description,
    actorUserId,
    createdAt: new Date(),
  };
}

/**
 * Moves every session to its target payroll status under the caller's
 * transaction, then appends one PAYROLL_STATUS_TRANSITION event per move.
 * Status writes run first so the events always describe committed-to state.
 * The partial-pay percentage travels with the status because the
 * partial-percentage CHECK binds the column to PARTIALLY rows.
 */
export async function transitionSessions(
  tx: DBTransaction,
  transitions: readonly SessionStatusTransition[],
  description: string,
  actorUserId: string
): Promise<void> {
  if (transitions.length === 0) return;
  await forEachInSequence(transitions, async transition => {
    await SchedulingRepository.updatePayrollCalculation(tx, transition.instanceId, {
      calculationStatus: transition.toStatus,
      isPartialPercentage: transition.isPartialPercentage,
    });
  });
  const events = transitions.map(transition => buildTransitionEvent(transition, description, actorUserId));
  await ClassStatusEventsRepository.createMany(events, tx);
}

/** Item snapshots for a carryover, read inside the caller's transaction. */
async function listCarryoverItems(tx: DBTransaction, carryoverId: string): Promise<CarryoverBalanceItemSelectType[]> {
  return tx.select().from(carryoverBalanceItems).where(eq(carryoverBalanceItems.carryoverId, carryoverId));
}

function parseStoredCalculationStatus(value: string): CalculationStatus | null {
  return CALCULATION_STATUS_BY_VALUE.get(value) ?? null;
}

/**
 * Percentage captured on a PARTIALLY item snapshot. A PARTIALLY session always
 * carries one on the live row (the partial-percentage CHECK enforces it), so a
 * snapshot without it is corrupt and must fail the revert before any session
 * moves to a state the CHECK would reject.
 */
function readSnapshotPartialPercentage(item: CarryoverBalanceItemSelectType, tErrors: ErrorsLabels): number {
  if (item.originalPartialPercentage == null) {
    throw new DomainError("CARRYOVER_SNAPSHOT_INVALID", tErrors.internalServerError);
  }
  return item.originalPartialPercentage;
}

/**
 * Restores each linked session to the calculation status captured in the
 * item snapshot, then detaches the sessions from the carryover.
 */
export async function revertAndUnlinkCarryoverSessions(
  tx: DBTransaction,
  carryover: CarryoverBalanceSelectType,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<number> {
  const items = await listCarryoverItems(tx, carryover.id);
  if (items.length === 0) return 0;

  const linkedInstances = await CarryoverBalanceRepository.findLinkedSessions(carryover.id, tx, {
    forUpdate: true,
  });
  const instanceById = new Map(linkedInstances.map(instance => [instance.id, instance]));

  const transitions: SessionStatusTransition[] = items.map(item => {
    const restoreStatus = parseStoredCalculationStatus(item.originalStatus);
    if (restoreStatus == null) {
      throw new DomainError("CARRYOVER_SNAPSHOT_INVALID", tErrors.internalServerError);
    }
    const instance = instanceById.get(item.classInstanceId);
    return {
      instanceId: item.classInstanceId,
      fromStatus: instance?.calculationStatus ?? CalculationStatus.WAITING_PAID,
      toStatus: restoreStatus,
      teacherPaidAmount: instance?.teacherPaidAmount ?? null,
      isPartialPercentage:
        restoreStatus === CalculationStatus.PARTIALLY ? readSnapshotPartialPercentage(item, tErrors) : null,
    };
  });

  await transitionSessions(tx, transitions, `Carryover ${carryover.id} deleted`, actorUserId);
  await SchedulingRepository.unlinkFromCarryover(
    items.map(item => item.classInstanceId),
    tx
  );
  return items.length;
}

export async function deleteCarryoverRowWithAudit(
  tx: DBTransaction,
  carryover: CarryoverBalanceSelectType,
  actorUserId: string
): Promise<string | null> {
  // The caller holds the row lock; the delete cannot miss the row.
  await CarryoverBalanceRepository.deleteById(carryover.id, tx);
  return emitCarryoverAuditLog(tx, {
    actorUserId,
    actorType: "USER",
    entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
    entityId: carryover.id,
    action: CARRYOVER_ACTION_DELETE,
    metadata: { teacherId: carryover.teacherId, payable: carryover.payable, currency: carryover.teacherCurrency },
  });
}
