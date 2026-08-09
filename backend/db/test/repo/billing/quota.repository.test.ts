import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { quotas } from "@/backend/db/schema";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaLedgerReason, QuotaPeriodType, QuotaStatus } from "@/backend/enum";
import type { QuotaSubmitInput, QuotaUpdateInput } from "@/backend/types";

describe("QuotaRepository", () => {
  test("create & findById", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Test Package",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const created = await QuotaRepository.create(tx, quotaInput);

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Test Package");
      expect(created.totalClasses).toBe(10);
      expect(created.remaining).toBe(10);

      const found = await QuotaRepository.findById(tx, created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });
  });

  test("listByStudent & listActiveByStudent", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput1: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Package 1",
        totalClasses: 5,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      await QuotaRepository.create(tx, quotaInput1);

      const quotaInput2: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Package 2",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const q2 = await QuotaRepository.create(tx, quotaInput2);
      const updatePayload: QuotaUpdateInput = {
        status: QuotaStatus.EXPIRED,
        version: q2.version,
      };
      await QuotaRepository.update(tx, q2.id, updatePayload);

      const allQuotas = await QuotaRepository.listByStudent(tx, student.id);
      expect(allQuotas).toHaveLength(2);

      const activeQuotas = await QuotaRepository.listActiveByStudent(tx, student.id);
      expect(activeQuotas).toHaveLength(1);
      expect(activeQuotas[0].name).toBe("Package 1");
    });
  });

  test("update with optimistic lock version", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Initial Name",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const created = await QuotaRepository.create(tx, quotaInput);

      const updatePayload: QuotaUpdateInput = {
        name: "Updated Name",
        version: created.version,
      };
      const updated = await QuotaRepository.update(tx, created.id, updatePayload);

      expect(updated.name).toBe("Updated Name");
      expect(updated.version).toBe(created.version + 1);
    });
  });

  test("softDelete", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "To Delete",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const created = await QuotaRepository.create(tx, quotaInput);

      const deleted = await QuotaRepository.softDelete(tx, created.id);
      expect(deleted.deletedAt).not.toBeNull();

      const found = await QuotaRepository.findById(tx, created.id);
      expect(found).toBeNull();
    });
  });

  test("selectQuotaForBookingFIFO returns highest-priority soonest-expiring quota", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      // Lower-priority quota with later expiry
      await QuotaRepository.create(tx, {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Low Priority Quota",
        totalClasses: 5,
        priority: 1,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        idempotencyKey: `quota-test-${randomUUID()}`,
      });

      // Higher-priority quota with sooner expiry — should be selected first
      const highPriority = await QuotaRepository.create(tx, {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "High Priority Quota",
        totalClasses: 5,
        priority: 10,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        idempotencyKey: `quota-test-${randomUUID()}`,
      });

      const selected = await QuotaRepository.selectQuotaForBookingFIFO(tx, student.id);
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe(highPriority.id);
    });
  });

  test("selectQuotaForBookingFIFO returns null when no active quotas", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      // No quotas created for this student
      const selected = await QuotaRepository.selectQuotaForBookingFIFO(tx, student.id);
      expect(selected).toBeNull();
    });
  });

  test("expireOverdue sets status to EXPIRED for past-due quotas", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Past Due Quota",
        totalClasses: 5,
        validUntil: yesterday,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const created = await QuotaRepository.create(tx, quotaInput);
      expect(created.status).toBe(QuotaStatus.ACTIVE);

      // Use explicit asOfDate to ensure deterministic behaviour regardless of clock precision
      const expired = await QuotaRepository.expireOverdue(tx, new Date());
      expect(expired.some(q => q.id === created.id)).toBe(true);

      const updated = await QuotaRepository.findById(tx, created.id);
      expect(updated?.status).toBe(QuotaStatus.EXPIRED);
    });
  });

  test("refreshPeriodic resets remaining for a periodic quota", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      // Use "EXPIRE" rollover policy so unused classes are discarded (not rolled over).
      // This produces both EXPIRE and GRANT ledger entries during the refresh.
      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PERIODIC,
        name: "Monthly Quota",
        totalClasses: 8,
        periodType: QuotaPeriodType.MONTHLY,
        periodDays: 30,
        rolloverPolicy: { maxRolloverPercent: 0, accumulationCap: 0 },
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const created = await QuotaRepository.create(tx, quotaInput);
      expect(created.remaining).toBe(8);

      // Backdate the period anchor so the 30-day period has expired and a refresh is triggered.
      // Without this, refreshPeriodic is a no-op (returns the unchanged row) and the version
      // would not bump — see the guard at the top of refreshPeriodic in the repository.
      await tx
        .update(quotas)
        .set({
          periodAnchor: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(quotas.id, created.id));

      const refreshed = await QuotaRepository.refreshPeriodic(tx, created.id, null);
      expect(refreshed.id).toBe(created.id);
      const refreshedRow = await tx.select().from(quotas).where(eq(quotas.id, created.id)).limit(1);
      expect(refreshedRow[0].version).toBe(created.version + 1);
      expect(refreshed.reservedClasses).toBe(0);
      // With 0% rollover, unused 8 classes are expired and 8 new classes are granted: 0 + 8 = 8.
      expect(refreshed.remaining).toBe(8);

      // Ledger should contain: initial GRANT (from create) + EXPIRE (unused) + GRANT (new period).
      const entries = await QuotaLedgerRepository.findByQuotaId(tx, created.id);
      const expireRows = entries.filter(e => e.reason === String(QuotaLedgerReason.EXPIRE));
      expect(expireRows).toHaveLength(1);
      expect(expireRows[0].delta).toBe(-8);
      const grantRows = entries.filter(e => e.reason === String(QuotaLedgerReason.GRANT));
      expect(grantRows).toHaveLength(2);
      expect(grantRows.some(e => e.delta === 8)).toBe(true);
    });
  });

  test("resetUsedThisPeriod clears usedThisPeriod, bumps version, and inserts ADJUST ledger row", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PERIODIC,
        name: "Reset Period Quota",
        totalClasses: 8,
        periodType: QuotaPeriodType.MONTHLY,
        periodDays: 30,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const created = await QuotaRepository.create(tx, quotaInput);
      expect(created.usedThisPeriod).toBe(0);

      // Simulate usage during the period
      await tx.update(quotas).set({ usedThisPeriod: 3 }).where(eq(quotas.id, created.id));

      const reset = await QuotaRepository.resetUsedThisPeriod(tx, created.id, "2026-08-01");
      expect(reset.id).toBe(created.id);
      expect(reset.usedThisPeriod).toBe(0);
      expect(reset.version).toBe(created.version + 1);

      // An ADJUST (delta=0) ledger row should be inserted for audit-trail completeness
      const entries = await QuotaLedgerRepository.findByQuotaId(tx, created.id);
      const adjustRows = entries.filter(e => e.reason === String(QuotaLedgerReason.ADJUST) && e.delta === 0);
      expect(adjustRows).toHaveLength(1);
      expect(adjustRows[0].reasonNote).toContain("2026-08-01");
    });
  });
});
