import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { ConflictError, logger, ValidationError } from "@/backend/lib";
import {
  assertStudentExists,
  isUniqueViolation,
  mapToReturnType,
} from "@/backend/services/billing/credit.service.helpers";
import { QuotaService } from "@/backend/services/billing/quota.service";
import type {
  CreditClassesSubmitInput,
  CreditHoursSubmitInput,
  CreditTransactionReturnType,
  DBTransaction,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export function validatePurchaseInput(input: CreditClassesSubmitInput, tErrors: ErrorsLabels): void {
  if (!input.studentId || input.studentId.trim().length === 0) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }

  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
}

/** Shared purchase logic: insert ledger row, adjust student classes, refresh quotas. */
async function executePurchase(
  tx: DBTransaction,
  input: CreditClassesSubmitInput,
  actorUserId: string,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<CreditTransactionReturnType> {
  const ledgerRow = await CreditRepository.createPurchase(tx, {
    studentId: input.studentId,
    changeAmount: input.hours,
    sourcePaymentId: input.sourcePaymentId ?? null,
    notes: input.notes ?? null,
    creditedByUserId: actorUserId,
    idempotencyKey,
  });

  await StudentRepository.addClasses(input.studentId, tErrors, input.hours, undefined, tx);
  await QuotaService.refreshStudentOndemandInstances(input.studentId, tx);
  return mapToReturnType(ledgerRow);
}

/**
 * Seed-only bootstrap flow: idempotent credit purchase that returns the first
 * persisted row on replay instead of double-crediting. The idempotency check
 * runs INSIDE the transaction to eliminate the TOCTOU race — a concurrent
 * purchase with the same key could insert between a pre-tx check and the tx
 * insert, producing a duplicate.
 */
export async function recordPurchaseIfMissingFlow(
  actorUserId: string,
  input: CreditClassesSubmitInput,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<CreditTransactionReturnType | null> {
  try {
    const created = await db.transaction(async tx => {
      await assertStudentExists(input.studentId, tErrors);

      const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
      if (existing.length > 0) {
        const existingRow = existing[0];
        if (existingRow) return mapToReturnType(existingRow);
        return null;
      }

      return executePurchase(tx, input, actorUserId, idempotencyKey, tErrors);
    });

    logger.info("Credit purchase seeded", {
      actorUserId,
      studentId: input.studentId,
      hours: input.hours,
      idempotencyKey,
    });

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
      if (resolved.length > 0) {
        const row = resolved[0];
        if (row) return mapToReturnType(row);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Caller-owned-tx purchase into the HOUR ledger. Does NOT check permissions
 * and does NOT open a transaction (mirrors recordPurchaseIfMissing):
 * duplicates RETURN the existing row instead of throwing.
 */
export async function recordHourPurchaseFlow(
  input: CreditHoursSubmitInput,
  idempotencyKey: string,
  tx: DBTransaction,
  tErrors: ErrorsLabels
): Promise<CreditTransactionReturnType | null> {
  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }

  const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
  if (existing.length > 0 && existing[0]) return mapToReturnType(existing[0]);

  const row = await CreditRepository.createHourPurchase(tx, {
    studentId: input.studentId,
    hours: input.hours,
    sourcePaymentId: input.sourcePaymentId ?? null,
    notes: input.notes ?? null,
    creditedByUserId: input.creditedByUserId,
    idempotencyKey,
  });
  await StudentRepository.addCreditHours(input.studentId, tErrors, input.hours, undefined, tx);
  return mapToReturnType(row);
}

/**
 * Seed-only bootstrap flow for the hour ledger with a caller-supplied
 * deterministic idempotency key. Mirrors `recordPurchaseIfMissing` — the
 * idempotency check runs INSIDE the transaction (no TOCTOU) and repeats return
 * the first persisted row instead of double-crediting. The core write
 * (hour ledger row + hour facet bump) is delegated to `recordHourPurchaseFlow`.
 */
export async function recordHourPurchaseIfMissingFlow(
  actorUserId: string,
  input: Omit<CreditHoursSubmitInput, "creditedByUserId">,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<CreditTransactionReturnType | null> {
  try {
    const created = await db.transaction(async tx => {
      await assertStudentExists(input.studentId, tErrors);

      return recordHourPurchaseFlow(
        {
          studentId: input.studentId,
          hours: input.hours,
          creditedByUserId: actorUserId,
          notes: input.notes ?? null,
        },
        idempotencyKey,
        tx,
        tErrors
      );
    });

    logger.info("Hour credit purchase seeded", {
      actorUserId,
      studentId: input.studentId,
      hours: input.hours,
      idempotencyKey,
    });

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
      const row = resolved[0];
      return row ? mapToReturnType(row) : null;
    }
    throw error;
  }
}

/**
 * Records a class-credit purchase. Derives the idempotency key, persists the
 * ledger row plus the student's class balance, and translates a concurrent
 * unique-constraint violation (TOCTOU) into the friendly `duplicatePurchase`
 * domain error instead of the raw Postgres constraint name.
 */
export async function recordPurchaseFlow(
  actorUserId: string,
  input: CreditClassesSubmitInput,
  tErrors: ErrorsLabels
): Promise<CreditTransactionReturnType> {
  const idempotencyKey = CreditRepository.generateIdempotencyKey({
    studentId: input.studentId,
    hours: input.hours,
    notes: input.notes ?? undefined,
    sourcePaymentId: input.sourcePaymentId,
  });

  try {
    const created = await db.transaction(async tx => {
      await assertStudentExists(input.studentId, tErrors);

      const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
      if (existing.length > 0) {
        throw new ConflictError(tErrors.credit.duplicatePurchase);
      }

      return executePurchase(tx, input, actorUserId, idempotencyKey, tErrors);
    });

    logger.info("Credit purchase recorded", {
      actorUserId,
      studentId: input.studentId,
      hours: input.hours,
    });

    return created;
  } catch (error) {
    // Catch raw Postgres unique-violation (23505) from a concurrent purchase
    // with the same idempotency key that slipped between the pre-check and
    // the insert (TOCTOU). Surface as a friendly duplicatePurchase error so
    // callers see a domain error instead of the raw Postgres constraint name.
    if (isUniqueViolation(error)) {
      throw new ConflictError(tErrors.credit.duplicatePurchase, { cause: error });
    }
    logger.error("Failed to record credit purchase", {
      actorUserId,
      studentId: input.studentId,
      error,
    });
    throw error;
  }
}
