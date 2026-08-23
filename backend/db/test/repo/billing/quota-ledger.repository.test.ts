import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { QuotaLedgerRepository, QuotaRepository } from "@/backend/db/repo/billing";
import { recurringSchedules } from "@/backend/db/schema";
import { ensureTestSubjectId, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaLedgerReason } from "@/backend/enum";
import type { QuotaSubmitInput } from "@/backend/types";

type QuotaLedgerSubmitInput = Parameters<typeof QuotaLedgerRepository.insert>[1];

describe("QuotaLedgerRepository", () => {
  test("insert & listByQuota", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Ledger Test Quota",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const quota = await QuotaRepository.create(tx, quotaInput);

      const ledgerInput: QuotaLedgerSubmitInput = {
        quotaId: quota.id,
        studentId: student.id,
        delta: 10,
        reason: QuotaLedgerReason.GRANT,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      };
      const entry = await QuotaLedgerRepository.insert(tx, ledgerInput);

      expect(entry.id).toBeDefined();
      expect(entry.delta).toBe(10);
      expect(entry.reason).toBe(QuotaLedgerReason.GRANT);

      const entries = await QuotaLedgerRepository.findByQuotaId(tx, quota.id);
      expect(entries).toHaveLength(2);

      expect(entries[0].id).toBe(entry.id);
    });
  });

  test("idempotent insert — same key returns same row without duplicate", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Idempotent Quota",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const quota = await QuotaRepository.create(tx, quotaInput);

      const sharedKey = `ledger-idempotent-${randomUUID()}`;
      const ledgerInput: QuotaLedgerSubmitInput = {
        quotaId: quota.id,
        studentId: student.id,
        delta: 5,
        reason: QuotaLedgerReason.GRANT,
        idempotencyKey: sharedKey,
      };

      const first = await QuotaLedgerRepository.insert(tx, ledgerInput);
      const second = await QuotaLedgerRepository.insert(tx, ledgerInput);

      expect(second.id).toBe(first.id);
      expect(second.delta).toBe(first.delta);

      const entries = await QuotaLedgerRepository.findByQuotaId(tx, quota.id);
      const grants = entries.filter(e => e.reason === "GRANT" && e.delta === 5);
      expect(grants).toHaveLength(1);
    });
  });

  test("computeBalance from ledger entries", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Compute Balance Quota",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const quota = await QuotaRepository.create(tx, quotaInput);

      const grantInput: QuotaLedgerSubmitInput = {
        quotaId: quota.id,
        studentId: student.id,
        delta: 10,
        reason: QuotaLedgerReason.GRANT,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      };
      await QuotaLedgerRepository.insert(tx, grantInput);

      const redeemInput: QuotaLedgerSubmitInput = {
        quotaId: quota.id,
        studentId: student.id,
        delta: -1,
        reason: QuotaLedgerReason.REDEEM,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      };
      await QuotaLedgerRepository.insert(tx, redeemInput);

      const balance = await QuotaLedgerRepository.computeBalance(tx, quota.id);
      // QuotaRepository.create automatically inserts a GRANT ledger row of delta=totalClasses (10).
      // With our 2 additional test inserts (+10 grant, -1 redeem), net sum is 10 + 10 - 1 = 19.
      expect(balance.remaining).toBe(19);
      expect(balance.reservedClasses).toBe(0);
    });
  });

  test("computeBalance with RESERVE, earmark RELEASE, and orphan RELEASE", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      const { teacher } = await setupTeacher(tx);
      const subjectId = await ensureTestSubjectId(tx);

      const now = new Date();
      const [schedule] = await tx
        .insert(recurringSchedules)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId,
          durationMinutes: 60,
          defaultStartTime: "10:00:00",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Orphan Release Balance Quota",
        totalClasses: 10,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const quota = await QuotaRepository.create(tx, quotaInput);

      // Reserve 5 classes for a recurring schedule
      const reserveInput: QuotaLedgerSubmitInput = {
        quotaId: quota.id,
        studentId: student.id,
        recurringScheduleId: schedule.id,
        delta: -5,
        reason: QuotaLedgerReason.RESERVE,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      };
      await QuotaLedgerRepository.insert(tx, reserveInput);

      // Earmark release: RELEASE with recurringScheduleId and no classInstanceId
      const earmarkReleaseInput: QuotaLedgerSubmitInput = {
        quotaId: quota.id,
        studentId: student.id,
        recurringScheduleId: schedule.id,
        delta: 2,
        reason: QuotaLedgerReason.RELEASE,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      };
      await QuotaLedgerRepository.insert(tx, earmarkReleaseInput);

      // Orphan release: RELEASE with no recurringScheduleId and no classInstanceId (expires reserved)
      const orphanReleaseInput: QuotaLedgerSubmitInput = {
        quotaId: quota.id,
        studentId: student.id,
        delta: 1,
        reason: QuotaLedgerReason.RELEASE,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      };
      await QuotaLedgerRepository.insert(tx, orphanReleaseInput);

      const balance = await QuotaLedgerRepository.computeBalance(tx, quota.id);
      // GRANT (10 from create) - RESERVE (5) + earmark RELEASE (2) + orphan RELEASE (1) = 8 remaining
      expect(balance.remaining).toBe(8);
      // reservedClasses = abs(RESERVE(-5) + earmark RELEASE(+2) + orphan RELEASE(+1)) = abs(-2) = 2
      expect(balance.reservedClasses).toBe(2);
    });
  });
});
