import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaStatus } from "@/backend/enum";
import { QuotaService } from "@/backend/services/billing/quota.service";

describe("Quota Expiry Sweeper Logic", () => {
  test("expireOverdueQuotas marks expired quotas", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);

      // Past date (yesterday)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const quota = await QuotaRepository.create(tx, {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Expiring Quota",
        totalClasses: 5,
        validUntil: yesterday,

        idempotencyKey: `quota-test-${randomUUID()}`,
      });

      expect(quota.status).toBe(QuotaStatus.ACTIVE);

      const expiredQuotas = await QuotaService.expireOverdueQuotas(tx);
      expect(expiredQuotas.length).toBeGreaterThanOrEqual(1);

      const updatedQuota = await QuotaRepository.findById(tx, quota.id);
      expect(updatedQuota?.status).toBe(QuotaStatus.EXPIRED);
    });
  });
});
