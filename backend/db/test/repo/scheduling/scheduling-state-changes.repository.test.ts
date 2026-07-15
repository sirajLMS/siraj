import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo";
import { classInstances, leaveQuotaUsage, students, teacherAssignments } from "@/backend/db/schema";
import {
  createMockClassInstance,
  createTestUser,
  setupStudent,
  setupTeacher,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { expectRepositoryError } from "@/backend/db/test/repo/scheduling/scheduling-test-helpers";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { AppPermission } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { PermissionsService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale/server-graphql";

describe("Scheduling Repository — State Changes & Leave Quota", () => {
  describe("State transitions and IDOR checks", () => {
    test("startClassInstance, markClassAbsent, processClassLeave, resetClassInstance work successfully", async () => {
      await runInRollback(async tx => {
        const { instance: inst1, teacher: t1 } = await setupTestEntities(tx, "State1");
        const id1 = inst1?.id;
        const u1 = t1.userId;
        if (!id1 || !u1) throw new Error("setup error");

        await SchedulingRepository.activateClassInstance(id1, u1, { force: false }, tx);
        const started1 = await SchedulingRepository.startClassInstance(id1, u1, tx);
        expect(started1?.executionState).toBe("RUNNING");
        const absent = await SchedulingRepository.markClassAbsent(id1, u1, tx);
        expect(absent?.executionState).toBe("COMPLETED");
        expect(absent?.outcome).toBe("ABSENT");

        const { instance: inst2, teacher: t2 } = await setupTestEntities(tx, "State2");
        const id2 = inst2?.id;
        const u2 = t2.userId;
        if (!id2 || !u2) throw new Error("setup error");

        await SchedulingRepository.activateClassInstance(id2, u2, { force: false }, tx);
        await SchedulingRepository.startClassInstance(id2, u2, tx);
        const leave = await SchedulingRepository.processClassLeave(id2, "Feeling sick", u2, tx);
        const [leaveInst] = await tx
          .select()
          .from(classInstances)
          .where(eq(classInstances.id, leave.originalId))
          .limit(1);
        expect(leaveInst?.executionState).toBe("COMPLETED");
        expect(leaveInst?.outcome).toBe("LEAVE");

        const { instance: inst3, teacher: t3 } = await setupTestEntities(tx, "State3");
        const id3 = inst3?.id;
        const u3 = t3.userId;
        if (!id3 || !u3) throw new Error("setup error");

        await SchedulingRepository.activateClassInstance(id3, u3, { force: false }, tx);
        await SchedulingRepository.startClassInstance(id3, u3, tx);
        const excused = await SchedulingRepository.processClassLeave(id3, null, u3, tx);
        const [excusedInst] = await tx
          .select()
          .from(classInstances)
          .where(eq(classInstances.id, excused.originalId))
          .limit(1);
        expect(excusedInst?.executionState).toBe("COMPLETED");
        expect(excusedInst?.outcome).toBe("LEAVE");

        const reverted = await SchedulingRepository.resetClassInstance(id1, u1, tx);
        expect(reverted?.executionState).toBe("NOT_ACTIVATED");
        expect(reverted?.outcome).toBe("PENDING");
      });
    });

    test("IDOR checks for teachers and parents throw unauthorizedAction", async () => {
      await runInRollback(async tx => {
        const { instance } = await setupTestEntities(tx, "IdorO");
        const id = instance?.id;
        if (!id) throw new Error("setup error");

        const { teacher: otherTeacher } = await setupTeacher(tx, {
          name: "Other Teacher",
          email: `other-${randomUUID()}@example.com`,
        });
        const otherUserId = otherTeacher.userId;
        if (!otherUserId) throw new Error("setup error");

        const teacherError = await expectRepositoryError(() =>
          SchedulingRepository.activateClassInstance(id, otherUserId, { force: false }, tx)
        );
        expect(teacherError.message).toContain("You are not authorized to perform this action");

        const { parent: otherParent } = await setupStudent(tx, {
          name: "Other Parent",
          email: `otherparent-${randomUUID()}@example.com`,
        });
        const otherParentUserId = otherParent.userId;
        if (!otherParentUserId) throw new Error("setup error");

        const parentError = await expectRepositoryError(() =>
          SchedulingRepository.activateClassInstance(id, otherParentUserId, { force: false }, tx)
        );
        expect(parentError.message).toContain("You are not authorized to perform this action");
      });
    });

    test("IDOR checks are bypassed for privileged admins", async () => {
      await runInRollback(async tx => {
        const { instance } = await setupTestEntities(tx, "IdorBypass");
        const id = instance?.id;
        if (!id) throw new Error("setup error");

        const adminUser = await createTestUser(tx, {
          isSuperAdmin: true,
          name: "Admin User",
          email: `admin-${randomUUID()}@example.com`,
        });

        const originalHasAnyPermission = PermissionsService.hasAnyPermission;
        PermissionsService.hasAnyPermission = async (userId: string, permissionKeys: AppPermission[]) => {
          if (userId === adminUser.id) return true;
          return originalHasAnyPermission(userId, permissionKeys);
        };

        try {
          const activated = await SchedulingRepository.activateClassInstance(id, adminUser.id, { force: false }, tx);
          expect(activated).not.toBeNull();
          expect(activated?.executionState).toBe("ACTIVATED");
        } finally {
          PermissionsService.hasAnyPermission = originalHasAnyPermission;
        }
      });
    });

    test("Invalid state transitions throw invalidTransition error", async () => {
      await runInRollback(async tx => {
        const { instance, teacher } = await setupTestEntities(tx, "Trans1");
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        await tx.update(classInstances).set({ executionState: "ACTIVATED" }).where(eq(classInstances.id, id));
        const activatedError = await expectRepositoryError(() =>
          SchedulingRepository.activateClassInstance(id, u, { force: false }, tx)
        );
        expect(activatedError.message).toContain("Invalid transition");

        const { instance: instance2, teacher: teacher2 } = await setupTestEntities(tx, "Trans2");
        const id2 = instance2?.id;
        const u2 = teacher2.userId;
        if (!id2 || !u2) throw new Error("setup error");
        const startError = await expectRepositoryError(() => SchedulingRepository.startClassInstance(id2, u2, tx));
        expect(startError.message).toContain("Invalid transition");

        const { instance: instance3, teacher: teacher3 } = await setupTestEntities(tx, "Trans3");
        const id3 = instance3?.id;
        const u3 = teacher3.userId;
        if (!id3 || !u3) throw new Error("setup error");
        const absentError = await expectRepositoryError(() => SchedulingRepository.stopClassInstance(id3, u3, tx));
        expect(absentError.message).toContain("Invalid transition");
      });
    });

    test("outOfQuota checks throw outOfQuota error", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "NoQuota", {
          skipInstance: true,
          classesRemaining: 0,
        });

        const createError = await expectRepositoryError(() =>
          SchedulingRepository.createClassInstance(
            {
              studentId: student.id,
              teacherId: teacher.id,
              scheduledStartAt: new Date(Date.now() + 86400000),
              scheduledEndAt: new Date(Date.now() + 90000000),
              durationMinutes: 60,
              classType: "REGULAR",
              idempotencyKey: randomUUID(),
              quotaDeducted: true,
            },
            tx
          )
        );
        expect(createError.message).toContain("Out of quota");

        const { student: s2, instance: i2 } = await setupTestEntities(tx, "QuotaUp1", {
          skipInstance: false,
          classesRemaining: 0,
        });
        const id2 = i2?.id;
        if (!id2) throw new Error("setup error");

        await tx.update(classInstances).set({ quotaDeducted: false }).where(eq(classInstances.id, id2));
        await tx.update(students).set({ classesRemaining: 0 }).where(eq(students.id, s2.id));

        const updateError = await expectRepositoryError(() =>
          SchedulingRepository.updateClassInstance(id2, { quotaDeducted: true }, tx)
        );
        expect(updateError.message).toContain("Out of quota");

        const { instance: i3 } = await setupTestEntities(tx, "QuotaUp2", { classesRemaining: 5 });
        const id3 = i3?.id;
        const t3 = i3?.teacherId;
        if (!id3 || !t3) throw new Error("setup error");

        const { student: s4 } = await setupStudent(
          tx,
          {
            name: "NoQuota Swap",
            email: `noq-swap-${randomUUID()}@example.com`,
          },
          {},
          { classesRemaining: 0 }
        );

        await tx.insert(teacherAssignments).values({
          studentId: s4.id,
          teacherId: t3,
          assignedAt: new Date(),
        });

        await tx.update(classInstances).set({ quotaDeducted: true }).where(eq(classInstances.id, id3));

        const swapError = await expectRepositoryError(() =>
          SchedulingRepository.updateClassInstance(id3, { studentId: s4.id }, tx)
        );
        expect(swapError.message).toContain("Out of quota");
      });
    });

    test("getClassStatusEvents and getTeacherProgressFeed work successfully", async () => {
      await runInRollback(async tx => {
        const { instance, teacher } = await setupTestEntities(tx, "EventsFeed");
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        await SchedulingRepository.activateClassInstance(id, u, { force: false }, tx);

        const events = await SchedulingRepository.getClassStatusEvents(id, tx);
        expect(events.length).toBeGreaterThan(0);

        const feed = await SchedulingRepository.getTeacherProgressFeed(
          teacher.id,
          new Date(),
          IanaTimezone.UTC,
          undefined,
          tx
        );
        expect(feed.length).toBeGreaterThan(0);
        expect(feed[0].id).toBe(events[0].id);
        expect(feed[0].studentName).toBeDefined();
        expect(feed[0].eventKind).toBe("activated");

        const feedNoTx = await SchedulingRepository.getTeacherProgressFeed(teacher.id, new Date(), IanaTimezone.UTC);
        expect(Array.isArray(feedNoTx)).toBe(true);

        const eventsNoTx = await SchedulingRepository.getClassStatusEvents(id, tx);
        expect(Array.isArray(eventsNoTx)).toBe(true);
      });
    });

    test("resetClassInstance restores quota if quotaDeducted was true", async () => {
      await runInRollback(async tx => {
        const { instance, student, teacher } = await setupTestEntities(tx, "ResetQ", { skipInstance: false });
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        await tx
          .update(classInstances)
          .set({ quotaDeducted: true, executionState: "ACTIVATED" })
          .where(eq(classInstances.id, id));
        const [sBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const reverted = await SchedulingRepository.resetClassInstance(id, u, tx);
        expect(reverted?.executionState).toBe("NOT_ACTIVATED");
        expect(reverted?.quotaDeducted).toBe(false);

        const [sAfter] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(sAfter.classesRemaining).toBe(sBefore.classesRemaining + 1);
      });
    });

    test("IDOR checks allow parent of student to perform action", async () => {
      await runInRollback(async tx => {
        const { student, user: parentUser } = await setupStudent(tx, {
          name: "Parent User",
          email: `parent-${randomUUID()}@example.com`,
        });
        const { teacher } = await setupTeacher(tx);

        await tx.insert(teacherAssignments).values({
          studentId: student.id,
          teacherId: teacher.id,
          assignedAt: new Date(),
        });

        const instance = await createMockClassInstance(tx, student.id, teacher.id);

        const activated = await SchedulingRepository.activateClassInstance(
          instance.id,
          parentUser.id,
          { force: true },
          tx
        );
        expect(activated).not.toBeNull();
        expect(activated?.executionState).toBe("ACTIVATED");
      });
    });

    test("processClassLeave throws error when instance doesn't exist", async () => {
      await runInRollback(async tx => {
        const fakeId = randomUUID();
        const notFoundError = await expectRepositoryError(() =>
          SchedulingRepository.processClassLeave(fakeId, "Sick", "some-actor-id", tx)
        );
        expect(notFoundError.message).toContain("not found");
      });
    });
  });

  describe("Leave Quota Integration with processClassLeave", () => {
    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth() + 1;

    test("processClassLeave increments teacher leave quota inside transaction", async () => {
      await runInRollback(async tx => {
        const { instance, teacher } = await setupTestEntities(tx, "QuotaLeave");
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        await SchedulingRepository.activateClassInstance(id, u, { force: false }, tx);

        const initialUsage = await SchedulingRepository.getTeacherLeaveQuotaUsage(
          teacher.id,
          currentYear,
          currentMonth,
          tx
        );
        expect(initialUsage).toBe(0);

        const tErrors = await getServerTranslations("en", "errors");
        await SchedulingRepository.processClassLeave(id, "Sick leave", u, tx, tErrors);

        const finalUsage = await SchedulingRepository.getTeacherLeaveQuotaUsage(
          teacher.id,
          currentYear,
          currentMonth,
          tx
        );
        expect(finalUsage).toBe(1);
      });
    });

    test("processClassLeave fails when teacher quota is already at maximum", async () => {
      await runInRollback(async tx => {
        const { instance, teacher } = await setupTestEntities(tx, "QuotaMaxLeave");
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        await SchedulingRepository.activateClassInstance(id, u, { force: false }, tx);

        await tx.insert(leaveQuotaUsage).values({
          teacherId: teacher.id,
          periodYear: currentYear,
          periodMonth: currentMonth,
          usedCount: 2,
        });

        const tErrors = await getServerTranslations("en", "errors");
        const quotaError = await expectRepositoryError(() =>
          SchedulingRepository.processClassLeave(id, "Third leave", u, tx, tErrors)
        );
        expect(quotaError.message).toContain("Leave quota exceeded");
      });
    });

    test("processClassLeave increments quota correctly across multiple leaves", async () => {
      await runInRollback(async tx => {
        const { teacher } = await setupTestEntities(tx, "QuotaMulti1");
        const { student: student2 } = await setupTestEntities(tx, "QuotaMulti2", { skipInstance: true });

        await tx
          .insert(teacherAssignments)
          .values({ studentId: student2.id, teacherId: teacher.id, assignedAt: new Date() });

        const now = new Date();
        const instance1 = await createMockClassInstance(tx, student2.id, teacher.id, {
          scheduledStartAt: new Date(now.getTime() + 86400000),
          scheduledEndAt: new Date(now.getTime() + 86400000 + 3600000),
        });
        await SchedulingRepository.activateClassInstance(instance1.id, teacher.userId, { force: false }, tx);
        const tErrors = await getServerTranslations("en", "errors");
        await SchedulingRepository.processClassLeave(instance1.id, "Leave 1", teacher.userId, tx, tErrors);

        const usage1 = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacher.id, currentYear, currentMonth, tx);
        expect(usage1).toBe(1);

        const { student: student3 } = await setupTestEntities(tx, "QuotaMulti3", { skipInstance: true });
        await tx
          .insert(teacherAssignments)
          .values({ studentId: student3.id, teacherId: teacher.id, assignedAt: new Date() });

        const instance2 = await createMockClassInstance(tx, student3.id, teacher.id, {
          scheduledStartAt: new Date(now.getTime() + 86400000 * 20),
          scheduledEndAt: new Date(now.getTime() + 86400000 * 20 + 3600000),
        });
        await SchedulingRepository.activateClassInstance(instance2.id, teacher.userId, { force: false }, tx);
        await SchedulingRepository.processClassLeave(instance2.id, "Leave 2", teacher.userId, tx, tErrors);

        const usage2 = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacher.id, currentYear, currentMonth, tx);
        expect(usage2).toBe(2);
      });
    });
  });
});
