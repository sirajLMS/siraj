import { and, eq, isNull } from "drizzle-orm";
import { deriveGrantIdempotencyKey, deriveIdempotencyKey } from "@/backend/db/repo/billing/quota.repository.helpers";
import { findByIdImpl } from "@/backend/db/repo/billing/quota.repository.reads";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import { DomainError, QuotaAlreadyDeletedError, QuotaLedgerError, QuotaNotFoundError } from "@/backend/lib/errors";
import type { DBTransaction, QuotaSelectType, QuotaSubmitInput, QuotaUpdateInput } from "@/backend/types";

export const createImpl = async (
  tx: DBTransaction,
  input: QuotaSubmitInput & { actorUserId?: string | null }
): Promise<QuotaSelectType> => {
  const now = new Date();
  const validFromDate = input.validFrom ? new Date(input.validFrom) : null;
  const validUntilDate = input.validUntil ? new Date(input.validUntil) : null;
  const validFromStr = validFromDate ? validFromDate.toISOString().slice(0, 10) : null;
  const validUntilStr = validUntilDate ? validUntilDate.toISOString().slice(0, 10) : null;

  const idempotencyKey =
    input.idempotencyKey ??
    deriveIdempotencyKey("create", input.studentId, input.kind, input.name, String(input.totalClasses));

  // Idempotent insert: ON CONFLICT (idempotency_key) DO NOTHING. If a row with
  // this key already exists (a duplicate creation attempt / retry), the insert
  // returns no rows and we fetch the existing record instead of throwing a
  // unique-constraint violation. This makes createQuota safely retriable and
  // deduplicates concurrent duplicate submission attempts (mirrors the
  // ledger repository's idempotency pattern).
  const [newQuota] = await tx
    .insert(quotas)
    .values({
      studentId: input.studentId,
      kind: input.kind,
      name: input.name,
      totalClasses: input.totalClasses,
      remaining: input.totalClasses,
      reservedClasses: 0,
      usedThisPeriod: 0,
      periodType: input.periodType ?? null,
      periodDays: input.periodDays ?? null,
      periodAnchor: input.kind === "PERIODIC" ? now : null,
      validFrom: validFromStr,
      validUntil: validUntilStr,
      status: QuotaStatus.ACTIVE,
      priority: input.priority ?? 0,
      rolloverPolicy: input.rolloverPolicy ?? null,
      version: 1,
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: quotas.idempotencyKey })
    .returning();

  if (newQuota) {
    const grantKey = deriveGrantIdempotencyKey(newQuota.id);
    // AUDIT: ledger entry required for initial GRANT tracking and balance reconstruction.
    // The grant insert is itself idempotent (ON CONFLICT DO NOTHING on its own key),
    // so a conflict here would simply return the existing ledger row.
    await QuotaLedgerRepository.insert(tx, {
      quotaId: newQuota.id,
      studentId: newQuota.studentId,
      delta: input.totalClasses,
      reason: QuotaLedgerReason.GRANT,
      reasonNote: `Initial quota grant: ${input.name}`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: grantKey,
    });

    return newQuota;
  }

  // Conflict — a quota with this idempotency key already exists; fetch and return it.
  const [existing] = await tx.select().from(quotas).where(eq(quotas.idempotencyKey, idempotencyKey)).limit(1);

  if (!existing) throw new QuotaLedgerError("Quota insert returned no rows and no existing row found");
  return existing;
};

export const updateImpl = async (
  tx: DBTransaction,
  id: string,
  input: QuotaUpdateInput & { actorUserId?: string | null }
): Promise<QuotaSelectType> => {
  const now = new Date();
  const existing = await findByIdImpl(tx, id);
  if (!existing) throw new QuotaNotFoundError("Quota not found");
  if (existing.version !== input.version) {
    throw new DomainError("CONCURRENCY_CONFLICT", "Quota version mismatch — please retry");
  }

  const updateData: Partial<QuotaSelectType> = {
    version: existing.version + 1,
    updatedAt: now,
  };

  if (input.name !== undefined && input.name != null) updateData.name = input.name;
  if (input.priority !== undefined && input.priority != null) updateData.priority = input.priority;
  if (input.status !== undefined && input.status != null) updateData.status = input.status;
  if (input.validUntil !== undefined) {
    updateData.validUntil = input.validUntil ? new Date(input.validUntil).toISOString().slice(0, 10) : null;
  }

  const [updated] = await tx
    .update(quotas)
    .set(updateData)
    .where(and(eq(quotas.id, id), eq(quotas.version, input.version)))
    .returning();

  if (!updated) throw new QuotaNotFoundError("Quota update failed due to concurrent modification");
  return updated;
};

export const softDeleteImpl = async (tx: DBTransaction, id: string): Promise<QuotaSelectType> => {
  const now = new Date();
  const [row] = await tx
    .update(quotas)
    .set({
      deletedAt: now,
      status: QuotaStatus.ARCHIVED,
      updatedAt: now,
    })
    .where(and(eq(quotas.id, id), isNull(quotas.deletedAt)))
    .returning();

  if (!row) throw new QuotaAlreadyDeletedError("Quota not found or already deleted");
  return row;
};
