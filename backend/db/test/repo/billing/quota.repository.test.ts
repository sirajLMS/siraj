import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { QuotaKind, QuotaStatus } from "@/backend/enum";
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
});
