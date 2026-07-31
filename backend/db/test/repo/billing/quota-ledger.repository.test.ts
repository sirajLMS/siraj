import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaLedgerReason } from "@/backend/enum";

describe("QuotaLedgerRepository", () => {
  test("insert & listByQuota", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quota = await QuotaRepository.create(tx, {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Ledger Test Quota",
        totalClasses: 10,

        idempotencyKey: `quota-test-${randomUUID()}`,
      });

      const entry = await QuotaLedgerRepository.insert(tx, {
        quotaId: quota.id,
        studentId: student.id,
        delta: 10,
        reason: QuotaLedgerReason.GRANT,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      });

      expect(entry.id).toBeDefined();
      expect(entry.delta).toBe(10);
      expect(entry.reason).toBe(QuotaLedgerReason.GRANT);

      const entries = await QuotaLedgerRepository.findByQuotaId(tx, quota.id);
      expect(entries).toHaveLength(2);

      expect(entries[0].id).toBe(entry.id);
    });
  });

  test("computeBalance from ledger entries", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quota = await QuotaRepository.create(tx, {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Compute Balance Quota",
        totalClasses: 10,

        idempotencyKey: `quota-test-${randomUUID()}`,
      });

      await QuotaLedgerRepository.insert(tx, {
        quotaId: quota.id,
        studentId: student.id,
        delta: 10,
        reason: QuotaLedgerReason.GRANT,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      });

      await QuotaLedgerRepository.insert(tx, {
        quotaId: quota.id,
        studentId: student.id,
        delta: -1,
        reason: QuotaLedgerReason.REDEEM,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      });

      const balance = await QuotaLedgerRepository.computeBalance(tx, quota.id);
      // QuotaRepository.create automatically inserts a GRANT ledger row of delta=totalClasses (10).
      // With our 2 additional test inserts (+10 grant, -1 redeem), net sum is 10 + 10 - 1 = 19.
      expect(balance.remaining).toBe(19);
      expect(balance.reservedClasses).toBe(0);
    });
  });
});
