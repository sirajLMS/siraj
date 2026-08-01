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
import type { QuotaReturnType, QuotaSubmitInput } from "@/backend/types";

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

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Service Test Quota",
        totalClasses: 12,
        idempotencyKey: `svc-quota-${randomUUID()}`,
      };
      const created = await QuotaService.createQuota(quotaInput, actor.id, "en", tx);

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Service Test Quota");
      expect(created.totalClasses).toBe(12);
      expect(created.remaining).toBe(12);

      const fetched: QuotaReturnType | null = await QuotaService.getQuota(created.id, "en", tx, actor.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
    });
  });

  test("reserveForRecurringSchedule & releaseForRecurringSchedule", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Earmark Test Quota",
        totalClasses: 10,
        idempotencyKey: `svc-quota-${randomUUID()}`,
      };
      const quota = await QuotaService.createQuota(quotaInput, actor.id, "en", tx);

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

      const reserved: QuotaReturnType = await QuotaService.reserveForRecurringSchedule(
        student.id,
        schedule.id,
        quota.id,
        4,
        actor.id,
        tx
      );

      expect(reserved.remaining).toBe(6);
      expect(reserved.reservedClasses).toBe(4);

      const released: QuotaReturnType = await QuotaService.releaseForRecurringSchedule(
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

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Redeem Test Quota",
        totalClasses: 5,
        idempotencyKey: `svc-quota-${randomUUID()}`,
      };
      const quota = await QuotaService.createQuota(quotaInput, actor.id, "en", tx);

      const redeemed: QuotaReturnType = await QuotaService.redeemForInstance(
        student.id,
        instance.id,
        quota.id,
        actor.id,
        tx
      );

      expect(redeemed.remaining).toBe(4);

      const released: QuotaReturnType = await QuotaService.releaseForInstance(
        student.id,
        instance.id,
        quota.id,
        actor.id,
        tx
      );

      expect(released.remaining).toBe(5);
    });
  });

  test("getStudentQuotaBalance", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Balance Quota 1",
        totalClasses: 10,
        idempotencyKey: `svc-quota-${randomUUID()}`,
      };
      await QuotaService.createQuota(quotaInput, actor.id, "en", tx);

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
      // redeemForInstance on a non-existent quota surfaces as a QuotaNotFoundError whose
      // message indicates the quota may be depleted or inactive (the repo's atomic
      // SELECT FOR UPDATE finds no matching ACTIVE row with remaining>0). This is the
      // not-found / not-usable failure path as surfaced through the service.
      expect((error as Error).message).toContain("depleted or inactive");
    });
  });

  test("createQuota is idempotent — re-submission with same key returns same result", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);
      const idempotencyKey = `svc-quota-idempotent-${randomUUID()}`;
      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Idempotent Quota",
        totalClasses: 8,
        idempotencyKey,
      };

      const first: QuotaReturnType = await QuotaService.createQuota(quotaInput, actor.id, "en", tx);

      const second: QuotaReturnType = await QuotaService.createQuota(quotaInput, actor.id, "en", tx);

      expect(second.id).toBe(first.id);
      expect(second.remaining).toBe(first.remaining);
      expect(second.totalClasses).toBe(first.totalClasses);
    });
  });

  test("invariant: remaining + reservedClasses <= totalClasses after operations", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);
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

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Invariant Quota",
        totalClasses: 10,
        idempotencyKey: `svc-quota-${randomUUID()}`,
      };
      const quota = await QuotaService.createQuota(quotaInput, actor.id, "en", tx);

      // Reserve 4 classes — must satisfy the DB check constraint
      // quotas_reserved_not_exceed_remaining_chk (reservedClasses <= remaining),
      // which for a count N on a fresh quota (total=T) requires N <= T-N, i.e. N <= T/2.
      // N=6 on a 10-class quota would leave remaining=4 < reservedClasses=6 → violation.
      const reserved = await QuotaService.reserveForRecurringSchedule(
        student.id,
        schedule.id,
        quota.id,
        4,
        actor.id,
        tx
      );
      expect(reserved.remaining + reserved.reservedClasses).toBeLessThanOrEqual(quota.totalClasses);

      // Release 2 — invariant must still hold
      const released = await QuotaService.releaseForRecurringSchedule(
        student.id,
        schedule.id,
        quota.id,
        2,
        actor.id,
        tx
      );
      expect(released.remaining + released.reservedClasses).toBeLessThanOrEqual(quota.totalClasses);
    });
  });

  test("race test — oversell prevention: second redeem on exhausted quota fails", async () => {
    await runInRollback(async tx => {
      const actor = await createTestUser(tx);
      const { student } = await setupStudent(tx);

      const quotaInput: QuotaSubmitInput = {
        studentId: student.id,
        kind: QuotaKind.PACKAGE,
        name: "Race Quota",
        totalClasses: 1,
        idempotencyKey: `svc-quota-${randomUUID()}`,
      };
      const quota = await QuotaService.createQuota(quotaInput, actor.id, "en", tx);
      expect(quota.remaining).toBe(1);

      // Sequential Redeems on a shared tx (serial within rollback, mirroring class_quota_race.test.ts).
      // The first redeem succeeds (remaining 1 → 0), the second must fail because remaining hits 0.
      // True concurrency testing requires separate connections and is deferred — see class_quota_race.test.ts.
      const teacher1 = await setupTeacher(tx);
      const instance1 = await createMockClassInstance(tx, student.id, teacher1.teacher.id);

      // First redeem succeeds
      const redeemed: QuotaReturnType = await QuotaService.redeemForInstance(
        student.id,
        instance1.id,
        quota.id,
        actor.id,
        tx
      );
      expect(redeemed.remaining).toBe(0);

      // Second redeem on the same quota should fail — remaining is 0
      const teacher2 = await setupTeacher(tx);
      const instance2 = await createMockClassInstance(tx, student.id, teacher2.teacher.id);
      let error: unknown = null;
      try {
        await QuotaService.redeemForInstance(student.id, instance2.id, quota.id, actor.id, tx);
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeNull();
    });
  });
});
