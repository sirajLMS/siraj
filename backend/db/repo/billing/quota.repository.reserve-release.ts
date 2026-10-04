import { and, eq, gt, gte, isNull, sql } from "drizzle-orm";

import { withForUpdate } from "@/backend/db";
import {
  buildLedgerValues,
  fetchLiveQuota,
  handleDuplicateIdempotencyKey,
} from "@/backend/db/repo/billing/quota.repository.helpers";
import { quotaLedger, quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import { ConflictError, QuotaLedgerError, QuotaNotFoundError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction, QuotaSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

// Atomic conditional UPDATE — surfaces as 500 under contention but prevents oversell
export const reserveClassesImpl = async (
  tx: DBTransaction,
  input: {
    quotaId: string;
    studentId: string;
    recurringScheduleId: string;
    count: number;
    actorUserId?: string | null;
    idempotencyKey: string;
  }
): Promise<QuotaSelectType> => {
  // Ledger-first pattern: Insert the ledger row BEFORE updating the balance.
  // If the idempotency key already exists (duplicate on retry), the insert affects 0 rows
  // and we return early — the operation was already applied, preventing double deduction.
  // AUDIT: ledger entry required for RESERVE tracking and balance reconstruction
  const ledgerResult = await tx
    .insert(quotaLedger)
    .values(
      buildLedgerValues(
        { ...input, classInstanceId: null },
        -input.count,
        QuotaLedgerReason.RESERVE,
        `Reserved ${input.count} classes for recurring schedule`
      )
    )
    .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

  if (ledgerResult.rowCount === 0) {
    // Duplicate idempotency key — operation already applied on a previous call
    return handleDuplicateIdempotencyKey(tx, "reserveClasses", input);
  }

  // Only update balance after successful ledger insert
  const now = new Date();
  const [updated] = await tx
    .update(quotas)
    .set({
      remaining: sql<number>`${quotas.remaining} - ${input.count}`,
      reservedClasses: sql<number>`${quotas.reservedClasses} + ${input.count}`,
      version: sql<number>`${quotas.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(quotas.id, input.quotaId),
        eq(quotas.studentId, input.studentId),
        eq(quotas.status, QuotaStatus.ACTIVE),
        gte(quotas.remaining, input.count),
        isNull(quotas.deletedAt)
      )
    )
    .returning();

  if (!updated) throw new QuotaLedgerError("Failed to update quota reservations");

  return updated;
};

// Atomic conditional UPDATE — surfaces as 500 under contention but prevents oversell
export const releaseForRecurringScheduleImpl = async (
  tx: DBTransaction,
  input: {
    quotaId: string;
    studentId: string;
    recurringScheduleId: string;
    count: number;
    actorUserId?: string | null;
    idempotencyKey: string;
  },
  locale?: string
): Promise<QuotaSelectType> => {
  // Ledger-first pattern: Insert the ledger row BEFORE updating the balance.
  // If the idempotency key already exists (duplicate on retry), the insert affects 0 rows
  // and we return early — the operation was already applied, preventing double credit.
  // AUDIT: ledger entry required for RELEASE tracking and balance reconstruction
  const ledgerResult = await tx
    .insert(quotaLedger)
    .values(
      buildLedgerValues(
        { ...input, classInstanceId: null },
        input.count,
        QuotaLedgerReason.RELEASE,
        `Released ${input.count} reserved classes for recurring schedule`
      )
    )
    .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

  if (ledgerResult.rowCount === 0) {
    // Duplicate idempotency key — operation already applied on a previous call
    return handleDuplicateIdempotencyKey(tx, "releaseForRecurringSchedule", input);
  }

  // Only update balance after successful ledger insert
  const now = new Date();

  const [updated] = await tx
    .update(quotas)
    .set({
      remaining: sql<number>`${quotas.remaining} + ${input.count}`,
      reservedClasses: sql<number>`${quotas.reservedClasses} - ${input.count}`,
      version: sql<number>`${quotas.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(quotas.id, input.quotaId),
        eq(quotas.studentId, input.studentId),
        eq(quotas.status, QuotaStatus.ACTIVE),
        gte(quotas.reservedClasses, input.count),
        isNull(quotas.deletedAt)
      )
    )
    .returning();

  if (!updated) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new ConflictError(tErrors.billing.quotaReleaseReservationFailed);
  }

  return updated;
};

export const redeemForInstanceImpl = async (
  tx: DBTransaction,
  input: {
    quotaId: string;
    studentId: string;
    classInstanceId: string;
    recurringScheduleId?: string | null;
    actorUserId?: string | null;
    idempotencyKey: string;
  }
): Promise<QuotaSelectType> => {
  // Lock the quota row for the duration of this transaction to prevent TOCTOU
  // races between the balance check and the deduction UPDATE below.
  const [locked] = await withForUpdate(
    tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt)
        )
      )
  ).limit(1);

  if (!locked) throw new QuotaNotFoundError("Failed to redeem quota class: quota may be depleted or inactive");

  // Ledger-first pattern (V3-002): Insert the ledger row BEFORE updating the balance.
  // A duplicate idempotency key (retry) inserts 0 rows → return the locked row, preventing double deduction.
  // AUDIT: ledger entry required for REDEEM tracking and balance reconstruction
  const ledgerResult = await tx
    .insert(quotaLedger)
    .values(
      buildLedgerValues(
        { ...input, recurringScheduleId: input.recurringScheduleId ?? null },
        -1,
        QuotaLedgerReason.REDEEM,
        `Redeemed 1 class for instance ${input.classInstanceId}`
      )
    )
    .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

  if (ledgerResult.rowCount === 0) {
    logger.info(
      `redeemForInstance: duplicate idempotency key, skipping (quota ${input.quotaId}, instance ${input.classInstanceId})`
    );
    return locked;
  }

  // Only update balance after successful ledger insert
  const now = new Date();
  const [updated] = await tx
    .update(quotas)
    .set({
      remaining: sql<number>`${quotas.remaining} - 1`,
      usedThisPeriod: sql<number>`${quotas.usedThisPeriod} + 1`,
      version: sql<number>`${quotas.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(quotas.id, input.quotaId),
        eq(quotas.studentId, input.studentId),
        eq(quotas.status, QuotaStatus.ACTIVE),
        gt(quotas.remaining, 0),
        isNull(quotas.deletedAt)
      )
    )
    .returning();

  if (!updated) throw new QuotaNotFoundError("Failed to redeem quota class: quota may be depleted or inactive");

  return updated;
};

export const releaseForInstanceImpl = async (
  tx: DBTransaction,
  input: {
    quotaId: string;
    studentId: string;
    classInstanceId: string;
    recurringScheduleId?: string | null;
    actorUserId?: string | null;
    idempotencyKey: string;
  }
): Promise<QuotaSelectType> => {
  // V3-043: delta=0 guard — if there are no classes to release, skip both ledger
  // and balance update. The delta for a single-instance release is always 1,
  // but we use Number() so the guard type-checks and is ready for future callers
  // that might pass a dynamic count.
  const releaseCount: number = 1;
  if (releaseCount === 0) {
    logger.info(
      `releaseForInstance: delta=0, skipping ledger insert and balance update (quota ${input.quotaId}, instance ${input.classInstanceId})`
    );
    const existing = await fetchLiveQuota(tx, input.quotaId, input.studentId);
    if (!existing) throw new QuotaNotFoundError("Quota not found");
    return existing;
  }

  // Ledger-first pattern (V3-003): Insert the ledger row BEFORE updating the balance.
  // A duplicate idempotency key (retry) inserts 0 rows → return the existing row, preventing double credit.
  // AUDIT: ledger entry required for RELEASE tracking and balance reconstruction
  const ledgerResult = await tx
    .insert(quotaLedger)
    .values(
      buildLedgerValues(
        { ...input, recurringScheduleId: input.recurringScheduleId ?? null },
        1,
        QuotaLedgerReason.RELEASE,
        `Released 1 class for instance ${input.classInstanceId}`
      )
    )
    .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

  if (ledgerResult.rowCount === 0) {
    logger.info(
      `releaseForInstance: duplicate idempotency key, skipping (quota ${input.quotaId}, instance ${input.classInstanceId})`
    );
    const existing = await fetchLiveQuota(tx, input.quotaId, input.studentId);
    if (!existing) throw new QuotaNotFoundError("Quota not found");
    return existing;
  }

  // Only update balance after successful ledger insert
  const now = new Date();
  const [updated] = await tx
    .update(quotas)
    .set({
      remaining: sql<number>`${quotas.remaining} + 1`,
      usedThisPeriod: sql<number>`CASE WHEN ${quotas.usedThisPeriod} > 1 THEN ${quotas.usedThisPeriod} - 1 ELSE 0 END`,
      version: sql<number>`${quotas.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(quotas.id, input.quotaId),
        eq(quotas.studentId, input.studentId),
        eq(quotas.status, QuotaStatus.ACTIVE),
        gt(quotas.usedThisPeriod, 0),
        isNull(quotas.deletedAt)
      )
    )
    .returning();

  if (!updated) throw new QuotaNotFoundError("Failed to release quota class: quota may be inactive or no classes used");

  return updated;
};
