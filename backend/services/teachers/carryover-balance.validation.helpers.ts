import { CarryoverBalanceRepository } from "@/backend/db/repo";
import { DomainError, NotFoundError, sanitizePlainText, ValidationError } from "@/backend/lib";
import { AUDITED_STATUSES, UUID_CANONICAL_PATTERN } from "@/backend/services/teachers/carryover-balance.constants";
import {
  formatAmountMinorUnits,
  toAmountMinorUnits,
} from "@/backend/services/teachers/carryover-balance.money.helpers";
import type { CarryoverBalanceSelectType, ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Rejects malformed identifiers before they reach the query layer: the uuid
 * columns would reject them with a raw database syntax error, leaking a 500
 * where a plain not-found is the correct contract.
 */
function assertUuidId(id: string, notFound: (value: string) => NotFoundError): void {
  if (!UUID_CANONICAL_PATTERN.test(id)) {
    throw notFound(id);
  }
}

export function assertCarryoverIdShape(id: string, tErrors: ErrorsLabels): void {
  assertUuidId(id, value => new NotFoundError("CARRYOVER", tErrors.carryover.notFound(value)));
}

export function assertCarryoverIdsShape(ids: readonly string[], tErrors: ErrorsLabels): void {
  for (const id of ids) {
    assertCarryoverIdShape(id, tErrors);
  }
}

export function assertInstanceIdsShape(ids: readonly string[], tErrors: ErrorsLabels): void {
  for (const id of ids) {
    assertUuidId(
      id,
      value => new NotFoundError("CLASS_INSTANCE", tErrors.scheduling.classInstanceNotFound({ id: value }))
    );
  }
}

export function assertTeacherIdShape(teacherId: string, tErrors: ErrorsLabels): void {
  assertUuidId(teacherId, value => new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(value)));
}

export function assertAllInstancesFound(
  instances: readonly ClassInstanceSelectType[],
  instanceIds: readonly string[],
  tErrors: ErrorsLabels
): void {
  if (instances.length === instanceIds.length) return;
  const foundIds = new Set(instances.map(instance => instance.id));
  const missingId = instanceIds.find(id => !foundIds.has(id));
  throw new NotFoundError("CLASS_INSTANCE", tErrors.scheduling.classInstanceNotFound({ id: missingId ?? "" }));
}

/** Every selected session must be audited and not already attached to a carryover. */
export function validateInstancesForCarryover(
  instances: readonly ClassInstanceSelectType[],
  tErrors: ErrorsLabels
): void {
  for (const instance of instances) {
    if (!AUDITED_STATUSES.has(instance.calculationStatus)) {
      throw new DomainError("CARRYOVER_SESSION_NOT_AUDITED", tErrors.carryover.sessionNotAudited);
    }
    if (instance.carryoverBalanceId != null) {
      throw new DomainError("CARRYOVER_SESSION_ALREADY_LINKED", tErrors.carryover.sessionAlreadyLinked);
    }
  }
}

export function assertAllCarryoversFound(
  carryovers: readonly CarryoverBalanceSelectType[],
  carryoverIds: readonly string[],
  tErrors: ErrorsLabels
): void {
  if (carryovers.length === carryoverIds.length) return;
  const foundIds = new Set(carryovers.map(carryover => carryover.id));
  const missingId = carryoverIds.find(id => !foundIds.has(id));
  throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(missingId ?? ""));
}

export function assertAllCarryoversUnpaid(
  carryovers: readonly CarryoverBalanceSelectType[],
  tErrors: ErrorsLabels
): void {
  for (const carryover of carryovers) {
    if (carryover.isPaid) {
      throw new DomainError("CARRYOVER_ALREADY_PAID", tErrors.carryover.alreadyPaid);
    }
  }
}

export function validatePeriod(fromDate: string | null, toDate: string | null, tErrors: ErrorsLabels): void {
  if (fromDate != null && toDate != null && fromDate > toDate) {
    throw new ValidationError(tErrors.invalidInput);
  }
}

/** Normalizes the manual-entry payable amount to the canonical two-decimal string; non-numeric or negative input rejects. */
export function normalizePayableAmount(payable: string, tErrors: ErrorsLabels): string {
  const units = toAmountMinorUnits(payable);
  if (units == null || units < 0n) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return formatAmountMinorUnits(units);
}

/** Sanitizes a nullable patch field; `undefined` (key absent from the patch) passes through untouched. */
export function sanitizePatchField(value: string | null | undefined, maxLength?: number): string | null | undefined {
  if (value === undefined || value === null) return value;
  return sanitizePlainText(value, maxLength ?? 2_000);
}

export async function verifyCarryoverDeletable(
  tx: DBTransaction,
  id: string,
  tErrors: ErrorsLabels
): Promise<CarryoverBalanceSelectType> {
  const [carryover] = await CarryoverBalanceRepository.getByIdsForUpdate([id], tx);
  if (carryover == null) {
    throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(id));
  }
  if (carryover.isPaid) {
    throw new DomainError("CARRYOVER_PAID_CANNOT_DELETE", tErrors.carryover.paidCannotDelete);
  }
  return carryover;
}
