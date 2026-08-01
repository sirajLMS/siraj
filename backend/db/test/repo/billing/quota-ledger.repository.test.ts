import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaLedgerReason } from "@/backend/enum";
import type { QuotaSubmitInput, QuotaLedgerInsertInput as RawQuotaLedgerInsertInput } from "@/backend/types";

type QuotaLedgerInsertInput = Omit<RawQuotaLedgerInsertInput, "reason"> & { reason: QuotaLedgerReason };

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

      const ledgerInput: QuotaLedgerInsertInput = {
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
      const ledgerInput: QuotaLedgerInsertInput = {
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
      const grants = entries.filter(e => e.reason === QuotaLedgerReason.GRANT && e.delta === 5);
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

      const grantInput: QuotaLedgerInsertInput = {
        quotaId: quota.id,
        studentId: student.id,
        delta: 10,
        reason: QuotaLedgerReason.GRANT,
        idempotencyKey: `ledger-test-${randomUUID()}`,
      };
      await QuotaLedgerRepository.insert(tx, grantInput);

      const redeemInput: QuotaLedgerInsertInput = {
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
});
