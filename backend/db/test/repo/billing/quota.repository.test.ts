import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaPeriodType, QuotaStatus } from "@/backend/enum";
import type { QuotaSubmitInput, QuotaUpdateType } from "@/backend/types";

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
      const updatePayload: QuotaUpdateType = {
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

      const updatePayload: QuotaUpdateType = {
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

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PERIODIC,
        name: "Monthly Quota",
        totalClasses: 8,
        periodType: QuotaPeriodType.MONTHLY,
        periodDays: 30,
        idempotencyKey: `quota-test-${randomUUID()}`,
      };
      const created = await QuotaRepository.create(tx, quotaInput);
      expect(created.remaining).toBe(8);

      const refreshed = await QuotaRepository.refreshPeriodic(tx, created.id, null);
      expect(refreshed.id).toBe(created.id);
      expect(refreshed.version).toBe(created.version + 1);
      expect(refreshed.reservedClasses).toBe(0);
    });
  });
});
