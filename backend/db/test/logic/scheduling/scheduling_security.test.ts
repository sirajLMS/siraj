import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { classInstances, recurringScheduleDays, recurringSchedules } from "@/backend/db/schema";
import { ensureTestSubjectId, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback, setupRlsRole, teardownRlsRole } from "@/backend/db/test/test-utils";
import { AppPermission } from "@/backend/enum";
import { PermissionsService, ScheduleDeletionService } from "@/backend/services";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

let tErrors: ErrorsLabels;

beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

describe("Scheduling Security & Trigger Compatibility", () => {
  beforeAll(async () => {
    await setupRlsRole();
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  it("should allow soft-deleting a class instance without violating state transition triggers", () =>
    runInRollback(async tx => {
      const { student, teacher } = await setupTestEntities(tx, "SoftDelTrg", { skipInstance: true });

      const [instance] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          classType: "REGULAR",
          scheduledStartAt: new Date(),
          scheduledEndAt: new Date(Date.now() + 3600000),
          durationMinutes: 60,
          idempotencyKey: randomUUID(),
          executionState: "NOT_ACTIVATED",
          outcome: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const result = await SchedulingRepository.deleteRecurringClass(instance.id, tx);
      expect(result).not.toBeNull();

      const [deleted] = await tx.select().from(classInstances).where(eq(classInstances.id, instance.id));
      expect(deleted.deletedAt).not.toBeNull();
    }));

  it("should allow soft-deleting an ACTIVATED class instance without trigger violation", () =>
    runInRollback(async tx => {
      const { student, teacher } = await setupTestEntities(tx, "SoftDelActTrg", { skipInstance: true });

      const [instance] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          classType: "REGULAR",
          scheduledStartAt: new Date(),
          scheduledEndAt: new Date(Date.now() + 3600000),
          durationMinutes: 60,
          idempotencyKey: randomUUID(),
          executionState: "ACTIVATED",
          outcome: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const result = await SchedulingRepository.deleteRecurringClass(instance.id, tx);
      expect(result).not.toBeNull();

      const [deleted] = await tx.select().from(classInstances).where(eq(classInstances.id, instance.id));
      expect(deleted.deletedAt).not.toBeNull();
    }));

  it("should allow soft-deleting a COMPLETED class instance without trigger violation", () =>
    runInRollback(async tx => {
      const { student, teacher } = await setupTestEntities(tx, "SoftDelCmpTrg", { skipInstance: true });

      const [instance] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          classType: "REGULAR",
          scheduledStartAt: new Date(),
          scheduledEndAt: new Date(Date.now() + 3600000),
          durationMinutes: 60,
          idempotencyKey: randomUUID(),
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: new Date(),
          actualEndAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const result = await SchedulingRepository.deleteRecurringClass(instance.id, tx);
      expect(result).not.toBeNull();

      const [deleted] = await tx.select().from(classInstances).where(eq(classInstances.id, instance.id));
      expect(deleted.deletedAt).not.toBeNull();
    }));

  it("should clear weekly schedule (soft delete all recurring schedules & set associated days inactive) without trigger violations", () =>
    runInRollback(async tx => {
      const { student, teacher } = await setupTestEntities(tx, "ClearWkTrg", { skipInstance: true });

      const [schedule1] = await tx
        .insert(recurringSchedules)
        .values({
          teacherId: teacher.id,
          studentId: student.id,
          subjectId: await ensureTestSubjectId(tx),
          durationMinutes: 60,
          defaultStartTime: "10:00:00",
          timezone: IanaTimezone.UTC,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const [schedule2] = await tx
        .insert(recurringSchedules)
        .values({
          teacherId: teacher.id,
          studentId: student.id,
          subjectId: await ensureTestSubjectId(tx),
          durationMinutes: 60,
          defaultStartTime: "14:00:00",
          timezone: IanaTimezone.UTC,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await tx.insert(recurringScheduleDays).values([
        {
          recurringScheduleId: schedule1.id,
          dayOfWeek: "MONDAY",
          startTime: "10:00:00",
          isActive: true,
        },
        {
          recurringScheduleId: schedule2.id,
          dayOfWeek: "WEDNESDAY",
          startTime: "14:00:00",
          isActive: true,
        },
      ]);

      const result = await SchedulingRepository.clearWeeklySchedule(teacher.id, tx);
      expect(result).not.toBeNull();

      const activeSchedules = await tx
        .select()
        .from(recurringSchedules)
        .where(and(eq(recurringSchedules.teacherId, teacher.id), isNull(recurringSchedules.deletedAt)));
      expect(activeSchedules).toHaveLength(0);

      const activeDays = await tx
        .select()
        .from(recurringScheduleDays)
        .where(
          and(
            eq(recurringScheduleDays.isActive, true),
            sql`${recurringScheduleDays.recurringScheduleId} IN (${schedule1.id}, ${schedule2.id})`
          )
        );
      expect(activeDays).toHaveLength(0);
    }));
});

describe("ScheduleDeletionService Permission Gating", () => {
  const originalHasPermission = PermissionsService.hasPermission;
  const mockPermissions = new Map<string, boolean>();

  beforeAll(() => {
    PermissionsService.hasPermission = async (userId: string, permissionKey: AppPermission) => {
      const key = `${userId}:${permissionKey}`;
      return mockPermissions.get(key) ?? false;
    };
  });

  afterAll(() => {
    PermissionsService.hasPermission = originalHasPermission;
  });

  it("deleteClass: enforces permission checks", async () => {
    const actorUserId = randomUUID();
    const classInstanceId = randomUUID();

    // Case 1: Lacks permission
    const error = await ScheduleDeletionService.deleteClass(actorUserId, classInstanceId, tErrors).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("sufficient permissions");

    // Case 2: Has permission
    mockPermissions.set(`${actorUserId}:${AppPermission.SCHEDULE_DELETE_CLASS}`, true);
    const result = await ScheduleDeletionService.deleteClass(actorUserId, classInstanceId, tErrors);
    expect(result).toBe(false);
  });

  it("clearWeeklySchedule: enforces permission checks", async () => {
    const actorUserId = randomUUID();
    const teacherId = randomUUID();

    // Case 1: Lacks permission
    const error = await ScheduleDeletionService.clearWeeklySchedule(actorUserId, teacherId, tErrors).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toContain("sufficient permissions");

    // Case 2: Has permission
    mockPermissions.set(`${actorUserId}:${AppPermission.SCHEDULE_CLEAR_WEEKLY}`, true);
    const result = await ScheduleDeletionService.clearWeeklySchedule(actorUserId, teacherId, tErrors);
    expect(result).toBe(false);
  });
});
