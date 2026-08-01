import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { recurringSchedules } from "@/backend/db/schema";
import {
  createMockClassInstance,
  createTestUser,
  ensureTestSubjectId,
  setupStudent,
  setupTeacher,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { type AppPermission, QuotaKind } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { QuotaService } from "@/backend/services/billing/quota.service";

describe("QuotaService", () => {
  const originalHasPermission = PermissionsService.hasPermission;

  beforeAll(() => {
    PermissionsService.hasPermission = async (_userId: string, _permissionKey: AppPermission) => true;
  });

  afterAll(() => {
    PermissionsService.hasPermission = originalHasPermission;
  });

  test("createQuota & getQuota", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);

      const created = await QuotaService.createQuota(
        {
          studentId: student.id,
          kind: QuotaKind.PACKAGE,
          name: "Service Test Quota",
          totalClasses: 12,
          idempotencyKey: `svc-quota-${randomUUID()}`,
        },
        actor.id,
        "en",
        tx
      );

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Service Test Quota");
      expect(created.totalClasses).toBe(12);
      expect(created.remaining).toBe(12);

      const fetched = await QuotaService.getQuota(created.id, "en", tx, actor.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
    });
  });

  test("reserveForRecurringSchedule & releaseForRecurringSchedule", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);

      const quota = await QuotaService.createQuota(
        {
          studentId: student.id,
          kind: QuotaKind.PACKAGE,
          name: "Earmark Test Quota",
          totalClasses: 10,
          idempotencyKey: `svc-quota-${randomUUID()}`,
        },
        actor.id,
        "en",
        tx
      );

      const teacher = await setupTeacher(tx);

      const subjectId = await ensureTestSubjectId(tx);
      const now = new Date();
      const [schedule] = await tx
        .insert(recurringSchedules)
        .values({
          studentId: student.id,
          teacherId: teacher.teacher.id,
          subjectId,
          durationMinutes: 60,
          defaultStartTime: "10:00:00",
          timezone: "UTC",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const reserved = await QuotaService.reserveForRecurringSchedule(
        student.id,
        schedule.id,
        quota.id,
        4,
        actor.id,
        tx
      );

      expect(reserved.remaining).toBe(6);
      expect(reserved.reservedClasses).toBe(4);

      const released = await QuotaService.releaseForRecurringSchedule(
        student.id,
        schedule.id,
        quota.id,
        4,
        actor.id,
        tx
      );

      expect(released.remaining).toBe(10);
      expect(released.reservedClasses).toBe(0);
    });
  });

  test("redeemForInstance & releaseForInstance", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);
      const teacher = await setupTeacher(tx);
      const instance = await createMockClassInstance(tx, student.id, teacher.teacher.id);

      const quota = await QuotaService.createQuota(
        {
          studentId: student.id,
          kind: QuotaKind.PACKAGE,
          name: "Redeem Test Quota",
          totalClasses: 5,
          idempotencyKey: `svc-quota-${randomUUID()}`,
        },
        actor.id,
        "en",
        tx
      );

      const redeemed = await QuotaService.redeemForInstance(student.id, instance.id, quota.id, actor.id, tx);

      expect(redeemed.remaining).toBe(4);

      const released = await QuotaService.releaseForInstance(student.id, instance.id, quota.id, actor.id, tx);

      expect(released.remaining).toBe(5);
    });
  });

  test("getStudentQuotaBalance", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);

      await QuotaService.createQuota(
        {
          studentId: student.id,
          kind: QuotaKind.PACKAGE,
          name: "Balance Quota 1",
          totalClasses: 10,
          idempotencyKey: `svc-quota-${randomUUID()}`,
        },
        actor.id,
        "en",
        tx
      );

      const balance = await QuotaService.getStudentQuotaBalance(student.id, tx, actor.id);
      expect(balance.studentId).toBe(student.id);
      expect(balance.totalActiveClasses).toBe(10);
      expect(balance.totalRemaining).toBe(10);
      expect(balance.breakdownByExpiration).toHaveLength(1);
    });
  });

  test("redeemForInstance fails when quota does not exist", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);
      const teacher = await setupTeacher(tx);
      const instance = await createMockClassInstance(tx, student.id, teacher.teacher.id);
      const nonExistentQuotaId = "00000000-0000-0000-0000-000000000000";

      let error: unknown = null;
      try {
        await QuotaService.redeemForInstance(student.id, instance.id, nonExistentQuotaId, actor.id, tx);
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeNull();
      expect((error as Error).message).toContain("not found");
    });
  });

  test("createQuota is idempotent — re-submission with same key returns same result", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);
      const idempotencyKey = `svc-quota-idempotent-${randomUUID()}`;

      const first = await QuotaService.createQuota(
        {
          studentId: student.id,
          kind: QuotaKind.PACKAGE,
          name: "Idempotent Quota",
          totalClasses: 8,
          idempotencyKey,
        },
        actor.id,
        "en",
        tx
      );

      const second = await QuotaService.createQuota(
        {
          studentId: student.id,
          kind: QuotaKind.PACKAGE,
          name: "Idempotent Quota",
          totalClasses: 8,
          idempotencyKey,
        },
        actor.id,
        "en",
        tx
      );

      expect(second.id).toBe(first.id);
      expect(second.remaining).toBe(first.remaining);
      expect(second.totalClasses).toBe(first.totalClasses);
    });
  });
});
