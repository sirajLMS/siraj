import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { quotas } from "@/backend/db/schema";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaPeriodType, QuotaStatus } from "@/backend/enum";
import { QuotaService } from "@/backend/services";
import type { QuotaSelectType, QuotaSubmitInput } from "@/backend/types";

describe("Quota Expiry Sweeper Logic", () => {
  test("expireOverdueQuotas marks expired quotas", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      // Past date (yesterday)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Expiring Quota",
        totalClasses: 5,
        validUntil: yesterday,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const quota: QuotaSelectType = await QuotaRepository.create(tx, quotaInput);

      expect(quota.status).toBe(QuotaStatus.ACTIVE);

      const expiredQuotas = await QuotaService.expireOverdueQuotas(tx);
      expect(expiredQuotas.length).toBeGreaterThanOrEqual(1);

      const updatedQuota = await QuotaRepository.findById(tx, quota.id);
      expect(updatedQuota?.status).toBe(QuotaStatus.EXPIRED);

      // Verify ledger entries: EXPIRE row from sweeper + GRANT row from initial creation
      const ledgerEntries = await QuotaLedgerRepository.findByQuotaId(tx, quota.id);
      const hasExpireRow = ledgerEntries.some(entry => entry.reason === "EXPIRE");
      const hasGrantRow = ledgerEntries.some(entry => entry.reason === "GRANT");
      expect(hasExpireRow).toBe(true);
      expect(hasGrantRow).toBe(true);
    });
  });

  test("refreshPeriodic inserts GRANT ledger row for periodic rollover", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PERIODIC,
        name: "Monthly Refresh Quota",
        totalClasses: 10,
        periodType: QuotaPeriodType.MONTHLY,
        periodDays: 30,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const quota: QuotaSelectType = await QuotaRepository.create(tx, quotaInput);
      expect(quota.remaining).toBe(10);

      // Backdate the period anchor so the 30-day period has expired and a refresh is triggered
      await tx
        .update(quotas)
        .set({
          periodAnchor: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(quotas.id, quota.id));

      const refreshed = await QuotaRepository.refreshPeriodic(tx, quota.id, null);
      const refreshedRow = await tx.select().from(quotas).where(eq(quotas.id, quota.id)).limit(1);
      expect(refreshedRow[0].version).toBe(quota.version + 1);
      expect(refreshed.reservedClasses).toBe(0);

      // Verify the rollover GRANT ledger row was inserted (periodic, not the initial creation grant)
      const ledgerEntries = await QuotaLedgerRepository.findByQuotaId(tx, quota.id);
      const grants = ledgerEntries.filter(entry => entry.reason === "GRANT" && entry.delta === quota.totalClasses);
      // One from creation, one from periodic refresh
      expect(grants.length).toBeGreaterThanOrEqual(2);
    });
  });
});
