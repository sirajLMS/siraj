import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import {
  classInstances,
  classStatusEvents,
  leaveQuotaUsage,
  parents,
  students,
  systemSettings,
  teacherAssignments,
  users,
} from "@/backend/db/schema";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { AppPermission } from "@/shared/lib/enum";
import {
  createMockClassInstance,
  createTestUser,
  setupStudent,
  setupTeacher,
  setupTestEntities,
} from "../entity-setup";
import { type DbTransaction, runInRollback } from "../test-utils";

interface ClassStatusEventState {
  executionState?: string;
  outcome?: string;
  deleted?: boolean;
}

async function expectRepositoryError(fn: () => Promise<unknown>) {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
}

/**
 * HELPER: testRepoError
 * Wrapper to drastically reduce CodeScene structural duplication issues.
 */
function testRepoError(name: string, logic: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(async tx => {
      await expectRepositoryError(() => logic(tx));
    });
  });
}

describe("Scheduling Repository logic", () => {
  describe("createClassInstance", () => {
    const getCreatePayload = (
      studentId: string,
      teacherId: string,
      start: Date,
      end: Date,
      overrides: Partial<typeof classInstances.$inferInsert> = {}
    ) => ({
      studentId,
      teacherId,
      scheduledStartAt: start,
      scheduledEndAt: end,
      durationMinutes: 60,
      classType: "REGULAR" as const,
      idempotencyKey: randomUUID(),
      ...overrides,
    });

    test("creates successfully with valid data and handles quota deduction", async () => {
      await runInRollback(async tx => {
        const { student, teacher, now } = await setupTestEntities(tx, "Create1", { skipInstance: true });
        const [studentBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const start = new Date(now.getTime() + 86400000); // tomorrow
        const end = new Date(start.getTime() + 3600000); // +1 hour

        const created = await SchedulingRepository.createClassInstance(
          getCreatePayload(student.id, teacher.id, start, end, { quotaDeducted: true }),
          tx
        );
        expect(created.quotaDeducted).toBe(true);

        const [studentAfter] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(studentAfter.classesRemaining).toBe(studentBefore.classesRemaining - 1);
      });
    });

    testRepoError("throws if teacher is not assigned to student", async tx => {
      const { student, now } = await setupTestEntities(tx, "Create2");
      const { teacher } = await setupTestEntities(tx, "CreateUnassigned");
      await SchedulingRepository.createClassInstance(
        getCreatePayload(
          student.id,
          teacher.id,
          new Date(now.getTime() + 86400000),
          new Date(now.getTime() + 90000000)
        ),
        tx
      );
    });

    testRepoError("throws on teacher overlap", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "Create3");
      const start = new Date(now.getTime() + 86400000);
      const end = new Date(start.getTime() + 3600000);
      await createMockClassInstance(tx, student.id, teacher.id, { scheduledStartAt: start, scheduledEndAt: end });
      const { student: student2 } = await setupTestEntities(tx, "Create4");
      await tx.insert(teacherAssignments).values({ studentId: student2.id, teacherId: teacher.id, assignedAt: now });
      await SchedulingRepository.createClassInstance(getCreatePayload(student2.id, teacher.id, start, end), tx);
    });

    testRepoError("throws on student overlap", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "CreateStudentOver");
      const start = new Date(now.getTime() + 86400000);
      const end = new Date(start.getTime() + 3600000);
      await createMockClassInstance(tx, student.id, teacher.id, { scheduledStartAt: start, scheduledEndAt: end });
      const { teacher: teacher2 } = await setupTestEntities(tx, "CreateStudentOver2");
      await tx.insert(teacherAssignments).values({ studentId: student.id, teacherId: teacher2.id, assignedAt: now });
      await SchedulingRepository.createClassInstance(getCreatePayload(student.id, teacher2.id, start, end), tx);
    });

    testRepoError("throws on zoomUrl overlap", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "CreateZoom");
      const start = new Date(now.getTime() + 86400000);
      const end = new Date(start.getTime() + 3600000);
      const zoomUrl = "https://zoom.us/j/123456789";
      await createMockClassInstance(tx, student.id, teacher.id, {
        scheduledStartAt: start,
        scheduledEndAt: end,
        zoomMeetingUrl: zoomUrl,
      });
      const { student: s2, teacher: t2 } = await setupTestEntities(tx, "CreateZoom2");
      await SchedulingRepository.createClassInstance(
        getCreatePayload(s2.id, t2.id, start, end, { zoomMeetingUrl: zoomUrl }),
        tx
      );
    });
  });

  describe("updateClassInstance", () => {
    testRepoError("throws if class instance not found", async tx => {
      await SchedulingRepository.updateClassInstance(randomUUID(), {}, tx);
    });

    test("toggles quota deduction and updates student classesRemaining correctly", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "UpdateQuota", { skipInstance: true });
        const [studentBefore] = await tx.select().from(students).where(eq(students.id, student.id));
        const instance = await createMockClassInstance(tx, student.id, teacher.id, { quotaDeducted: false });

        await SchedulingRepository.updateClassInstance(instance.id, { quotaDeducted: true }, tx);
        const [s1] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(s1.classesRemaining).toBe(studentBefore.classesRemaining - 1);

        await SchedulingRepository.updateClassInstance(instance.id, { quotaDeducted: false }, tx);
        const [s2] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(s2.classesRemaining).toBe(studentBefore.classesRemaining);
      });
    });

    test("skips validation when soft deleting (deletedAt is set)", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "UpdateDelete");
        const instance = await createMockClassInstance(tx, student.id, teacher.id);
        const deletedAt = new Date();
        const updated = await SchedulingRepository.updateClassInstance(instance.id, { deletedAt }, tx);
        expect(updated.deletedAt).toEqual(deletedAt);
      });
    });

    test("swapping student adjusts both quotas if quotaDeducted is true", async () => {
      await runInRollback(async tx => {
        const { student: student1, teacher, now } = await setupTestEntities(tx, "UpdateSwap1", { skipInstance: true });
        const { student: student2 } = await setupTestEntities(tx, "UpdateSwap2", { skipInstance: true });
        await tx.insert(teacherAssignments).values({ studentId: student2.id, teacherId: teacher.id, assignedAt: now });
        const instance = await createMockClassInstance(tx, student1.id, teacher.id, { quotaDeducted: true });

        const [s1Before] = await tx.select().from(students).where(eq(students.id, student1.id));
        const [s2Before] = await tx.select().from(students).where(eq(students.id, student2.id));

        await SchedulingRepository.updateClassInstance(instance.id, { studentId: student2.id }, tx);

        const [s1After] = await tx.select().from(students).where(eq(students.id, student1.id));
        const [s2After] = await tx.select().from(students).where(eq(students.id, student2.id));

        expect(s1After.classesRemaining).toBe(s1Before.classesRemaining + 1);
        expect(s2After.classesRemaining).toBe(s2Before.classesRemaining - 1);
      });
    });
  });

  describe("deleteClassInstance", () => {
    testRepoError("throws if class instance not found", async tx => {
      await SchedulingRepository.deleteClassInstance(randomUUID(), tx);
    });

    test("soft deletes and refunds quota if quotaDeducted was true", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "DeleteClass");
        const instance = await createMockClassInstance(tx, student.id, teacher.id, { quotaDeducted: true });
        const [sBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const deleted = await SchedulingRepository.deleteClassInstance(instance.id, tx);
        expect(deleted.deletedAt).not.toBeNull();

        const [sAfter] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(sAfter.classesRemaining).toBe(sBefore.classesRemaining + 1);
      });
    });
  });

  describe("rescheduleClassInstance", () => {
    const getReschedulePayload = (
      studentId: string,
      teacherId: string,
      overrides: Partial<typeof classInstances.$inferInsert> = {}
    ) => ({
      studentId,
      teacherId,
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(),
      durationMinutes: 60,
      classType: "REGULAR" as const,
      idempotencyKey: randomUUID(),
      ...overrides,
    });

    testRepoError("throws if original class not found", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched1");
      await SchedulingRepository.rescheduleClassInstance(
        randomUUID(),
        getReschedulePayload(student.id, teacher.id),
        tx
      );
    });

    testRepoError("throws if rescheduling to self", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched2");
      const instance = await createMockClassInstance(tx, student.id, teacher.id);
      await SchedulingRepository.rescheduleClassInstance(
        instance.id,
        getReschedulePayload(student.id, teacher.id, { id: instance.id }),
        tx
      );
    });

    testRepoError("throws if original is completed or taken", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "Resched3");
      const instance = await createMockClassInstance(tx, student.id, teacher.id, {
        executionState: "COMPLETED",
        outcome: "TAKEN",
        actualStartAt: now,
        actualEndAt: new Date(now.getTime() + 3600000),
      });
      await SchedulingRepository.rescheduleClassInstance(instance.id, getReschedulePayload(student.id, teacher.id), tx);
    });

    testRepoError("throws if already rescheduled", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched4");
      const instance = await createMockClassInstance(tx, student.id, teacher.id, { isRescheduled: true });
      await SchedulingRepository.rescheduleClassInstance(instance.id, getReschedulePayload(student.id, teacher.id), tx);
    });

    test("creates new instance, marks old as rescheduled, and refunds quota", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "ReschedSuccess");
        const original = await createMockClassInstance(tx, student.id, teacher.id, { quotaDeducted: true });
        const [sBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const now = new Date();
        const start = new Date(now.getTime() + 86400000 * 2);
        const end = new Date(start.getTime() + 3600000);

        const newInstance = await SchedulingRepository.rescheduleClassInstance(
          original.id,
          getReschedulePayload(student.id, teacher.id, { scheduledStartAt: start, scheduledEndAt: end }),
          tx
        );
        expect(newInstance.originalClassId).toBe(original.id);
        expect(newInstance.quotaDeducted).toBe(false);

        const [updatedOriginal] = await tx.select().from(classInstances).where(eq(classInstances.id, original.id));
        expect(updatedOriginal.isRescheduled).toBe(true);
        expect(updatedOriginal.outcome).toBe("PENDING");

        const [sAfter] = await tx.select().from(students).where(eq(students.id, student.id));
        expect(sAfter.classesRemaining).toBe(sBefore.classesRemaining + 1);
      });
    });
  });

  describe("getDailyMetrics and getDailySchedule", () => {
    test("returns correct metrics and schedule for a given date", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "Metrics");
        const testDate = new Date("2028-01-01T12:00:00Z");

        const initialMetrics = await SchedulingRepository.getDailyMetrics(testDate, teacher.id, tx);
        const initialSchedule = await SchedulingRepository.getDailySchedule(testDate, teacher.id, tx);

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: testDate,
          scheduledEndAt: new Date(testDate.getTime() + 3600000),
          classType: "REGULAR",
          outcome: "PENDING",
          executionState: "NOT_ACTIVATED",
        });
        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: testDate,
          scheduledEndAt: new Date(testDate.getTime() + 3600000),
          classType: "TRIAL",
          outcome: "TAKEN",
          executionState: "COMPLETED",
          actualStartAt: testDate,
          actualEndAt: new Date(testDate.getTime() + 3600000),
        });

        const newMetrics = await SchedulingRepository.getDailyMetrics(testDate, teacher.id, tx);
        const newSchedule = await SchedulingRepository.getDailySchedule(testDate, teacher.id, tx);

        expect(newMetrics.total).toBe(initialMetrics.total + 2);
        expect(newMetrics.regular).toBe(initialMetrics.regular + 1);
        expect(newMetrics.trial).toBe(initialMetrics.trial + 1);
        expect(newMetrics.taken).toBe(initialMetrics.taken + 1);
        expect(newMetrics.pending).toBe(initialMetrics.pending + 1);
        expect(newSchedule.length).toBe(initialSchedule.length + 2);

        const scheduledClass = newSchedule.find(s => s.classType === "REGULAR");
        expect(scheduledClass?.student).toBeDefined();
        expect(scheduledClass?.teacher).toBeDefined();
      });
    });

    test("handles no transaction context natively", async () => {
      const date = new Date("2029-01-01T00:00:00Z");
      const metrics = await SchedulingRepository.getDailyMetrics(date);
      expect(metrics.total).toBeGreaterThanOrEqual(0);
      const schedule = await SchedulingRepository.getDailySchedule(date, { search: "NoMatchHere" });
      expect(Array.isArray(schedule)).toBe(true);
    });
  });

  describe("Timezone and Transitions", () => {
    test("resolveStudentTimezone resolves correctly from hierarchy", async () => {
      await runInRollback(async tx => {
        const { student, parent } = await setupTestEntities(tx, "tz1");

        await tx
          .insert(systemSettings)
          .values({
            key: "default_timezone",
            value: "Europe/Paris",
            dataType: "string",
            description: "desc",
            category: "test",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: { value: "Europe/Paris" },
          });

        await tx.update(parents).set({ timezone: "Africa/Cairo" }).where(eq(parents.id, parent.id));

        let tz = await SchedulingRepository.resolveStudentTimezone(student.id, tx);
        expect(tz).toBe("Africa/Cairo");

        await tx.update(students).set({ timezoneOverride: "America/New_York" }).where(eq(students.id, student.id));
        tz = await SchedulingRepository.resolveStudentTimezone(student.id, tx);
        expect(tz).toBe("America/New_York");
      });
    });

    test("activateClassInstance sets flags and creates event", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "activate");
        const instance = await createMockClassInstance(tx, student.id, teacher.id, {
          executionState: "NOT_ACTIVATED",
        });

        const updated = await SchedulingRepository.activateClassInstance(
          instance.id,
          teacher.userId,
          { force: true },
          tx
        );
        if (!updated) throw new Error("Failed to activate class instance");

        expect(updated.executionState).toBe("ACTIVATED");
        expect(updated.forceActivated).toBe(true);
        expect(updated.forceActivatedByUserId).toBe(teacher.userId);

        const [event] = await tx
          .select()
          .from(classStatusEvents)
          .where(eq(classStatusEvents.classInstanceId, instance.id));
        expect(event).toBeDefined();
        expect(event.eventType).toBe("STATE_CHANGE");
        expect((event.toState as ClassStatusEventState).executionState).toBe("ACTIVATED");
      });
    });

    test("stopClassInstance sets flags and creates event", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "stop");
        const instance = await createMockClassInstance(tx, student.id, teacher.id, {
          executionState: "RUNNING",
          actualStartAt: new Date(),
        });

        const updated = await SchedulingRepository.stopClassInstance(instance.id, teacher.userId, tx);
        if (!updated) throw new Error("Failed to stop class instance");

        expect(updated.executionState).toBe("COMPLETED");
        expect(updated.outcome).toBe("TAKEN");
        expect(updated.actualEndAt).toBeDefined();

        const [event] = await tx
          .select()
          .from(classStatusEvents)
          .where(eq(classStatusEvents.classInstanceId, instance.id));
        expect(event).toBeDefined();
        expect(event.eventType).toBe("STATE_CHANGE");
        expect((event.toState as ClassStatusEventState).executionState).toBe("COMPLETED");
        expect((event.toState as ClassStatusEventState).outcome).toBe("TAKEN");
      });
    });

    test("softDeleteClassInstance creates event and restores quota", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "softDel2");
        const instance = await createMockClassInstance(tx, student.id, teacher.id, {
          executionState: "NOT_ACTIVATED",
          quotaDeducted: true,
        });

        const initialStudent = await tx
          .select()
          .from(students)
          .where(eq(students.id, student.id))
          .then(r => r[0]);

        const updated = await SchedulingRepository.softDeleteClassInstance(instance.id, teacher.userId, tx);
        expect(updated).not.toBeNull();
        expect(updated?.deletedAt).toBeDefined();

        const [event] = await tx
          .select()
          .from(classStatusEvents)
          .where(eq(classStatusEvents.classInstanceId, instance.id));
        expect(event).toBeDefined();
        expect((event.toState as ClassStatusEventState).deleted).toBe(true);

        const finalStudent = await tx
          .select()
          .from(students)
          .where(eq(students.id, student.id))
          .then(r => r[0]);
        expect(finalStudent.classesRemaining).toBe(initialStudent.classesRemaining + 1);

        // Missing instance fallback
        const missing = await SchedulingRepository.softDeleteClassInstance(randomUUID(), teacher.userId, tx);
        expect(missing).toBeNull();
      });
    });

    test("getClassInstanceById includes relations", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "getById");
        const instance = await createMockClassInstance(tx, student.id, teacher.id);

        const result = await SchedulingRepository.getClassInstanceById(instance.id, tx);
        expect(result).toBeDefined();
        expect(result?.student?.id).toBe(student.id);
        expect(result?.teacher?.id).toBe(teacher.id);
        expect(result?.teacher?.user).toBeDefined();

        const missing = await SchedulingRepository.getClassInstanceById(randomUUID(), tx);
        expect(missing).toBeNull();
      });
    });

    test("getDailySchedule handles search and timezones", async () => {
      await runInRollback(async tx => {
        // We pass { skipInstance: true } to prevent creating a dynamic default class instance relative to 'now'.
        // Otherwise, if the test is run late in the UTC day, 'now + 1 hour' can cross into the next day in the target
        // timezone (e.g. UTC+3 for Cairo), polluting the results and causing flakiness.
        const { student, teacher, teacherUser } = await setupTestEntities(tx, "schSrch", { skipInstance: true });

        await tx.update(students).set({ name: "Searchable Student XYZ" }).where(eq(students.id, student.id));
        await tx.update(users).set({ name: "Unrelated Teacher Name" }).where(eq(users.id, teacherUser.id));

        const date = new Date("2026-06-19T10:00:00.000Z");

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2026-06-19T12:00:00.000Z"),
          scheduledEndAt: new Date("2026-06-19T13:00:00.000Z"),
        });

        // Search by student name
        let schedule = await SchedulingRepository.getDailySchedule(
          date,
          {
            search: "XYZ",
            viewerTimezone: "UTC",
          },
          tx
        );
        expect(schedule.length).toBe(1);
        expect(schedule[0].yourTimeFormatted).toBe("12:00 PM"); // 12:00 UTC

        // Search by teacher name
        schedule = await SchedulingRepository.getDailySchedule(
          date,
          { search: "Unrelated", viewerTimezone: "Africa/Cairo" },
          tx
        );
        expect(schedule.length).toBe(1);
        expect(schedule[0].yourTimeFormatted).toBe("03:00 PM"); // 15:00 UTC+3

        // No match
        schedule = await SchedulingRepository.getDailySchedule(date, { search: "NoMatchHere" }, tx);
        expect(schedule.length).toBe(0);
      });
    });
  });

  describe("Missing Coverage Extensions", () => {
    test("startClassInstance, markClassAbsent, processClassLeave, resetClassInstance work successfully", async () => {
      await runInRollback(async tx => {
        // Test 1: startClassInstance (ACTIVATED -> RUNNING) and markClassAbsent (RUNNING -> COMPLETED with ABSENT)
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

        // Test 2: processClassLeave (RUNNING -> COMPLETED with LEAVE)
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

        // Test 3: admin excuse leave via processClassLeave
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

        // Test 4: resetClassInstance (COMPLETED -> NOT_ACTIVATED)
        // From absent class in Test 1
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

        // Create another teacher
        const { teacher: otherTeacher } = await setupTeacher(tx, {
          name: "Other Teacher",
          email: `other-${randomUUID()}@example.com`,
        });
        const otherUserId = otherTeacher.userId;
        if (!otherUserId) throw new Error("setup error");

        // Other teacher trying to activate should throw
        await expectRepositoryError(() =>
          SchedulingRepository.activateClassInstance(id, otherUserId, { force: false }, tx)
        );

        // Create another parent
        const { parent: otherParent } = await setupStudent(tx, {
          name: "Other Parent",
          email: `otherparent-${randomUUID()}@example.com`,
        });
        const otherParentUserId = otherParent.userId;
        if (!otherParentUserId) throw new Error("setup error");

        // Other parent trying to activate should throw
        await expectRepositoryError(() =>
          SchedulingRepository.activateClassInstance(id, otherParentUserId, { force: false }, tx)
        );
      });
    });

    test("IDOR checks are bypassed for privileged admins", async () => {
      await runInRollback(async tx => {
        const { instance } = await setupTestEntities(tx, "IdorBypass");
        const id = instance?.id;
        if (!id) throw new Error("setup error");

        // Create an admin user (privileged actor)
        const adminUser = await createTestUser(tx, {
          isSuperAdmin: true,
          name: "Admin User",
          email: `admin-${randomUUID()}@example.com`,
        });

        // Mock hasAnyPermission to return true for the adminUser
        const originalHasAnyPermission = PermissionsService.hasAnyPermission;
        PermissionsService.hasAnyPermission = async (userId: string, permissionKeys: AppPermission[]) => {
          if (userId === adminUser.id) return true;
          return originalHasAnyPermission(userId, permissionKeys);
        };

        try {
          // Admin trying to activate another teacher's instance should succeed (not throw unauthorizedAction)
          const activated = await SchedulingRepository.activateClassInstance(id, adminUser.id, { force: false }, tx);
          expect(activated).not.toBeNull();
          expect(activated?.executionState).toBe("ACTIVATED");
        } finally {
          // Restore mock
          PermissionsService.hasAnyPermission = originalHasAnyPermission;
        }
      });
    });

    test("Invalid state transitions throw invalidTransition error", async () => {
      await runInRollback(async tx => {
        // ACTIVATED state when trying to activate again -> throws
        const { instance, teacher } = await setupTestEntities(tx, "Trans1");
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        await tx.update(classInstances).set({ executionState: "ACTIVATED" }).where(eq(classInstances.id, id));
        await expectRepositoryError(() => SchedulingRepository.activateClassInstance(id, u, { force: false }, tx));

        // NOT_ACTIVATED when trying to start -> throws
        const { instance: instance2, teacher: teacher2 } = await setupTestEntities(tx, "Trans2");
        const id2 = instance2?.id;
        const u2 = teacher2.userId;
        if (!id2 || !u2) throw new Error("setup error");
        await expectRepositoryError(() => SchedulingRepository.startClassInstance(id2, u2, tx));

        // NOT_ACTIVATED when trying to complete -> throws
        const { instance: instance3, teacher: teacher3 } = await setupTestEntities(tx, "Trans3");
        const id3 = instance3?.id;
        const u3 = teacher3.userId;
        if (!id3 || !u3) throw new Error("setup error");
        await expectRepositoryError(() => SchedulingRepository.markClassAbsent(id3, u3, tx));
      });
    });

    test("outOfQuota checks throw outOfQuota error", async () => {
      await runInRollback(async tx => {
        // 1. createClassInstance with 0 quota
        const { student, teacher } = await setupTestEntities(tx, "NoQuota", {
          skipInstance: true,
          classesRemaining: 0,
        });

        await expectRepositoryError(() =>
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

        // 2. updateClassInstance with 0 quota
        const { student: s2, instance: i2 } = await setupTestEntities(tx, "QuotaUp1", {
          skipInstance: false,
          classesRemaining: 0,
        });
        const id2 = i2?.id;
        if (!id2) throw new Error("setup error");

        // Set instance quotaDeducted to false initially
        await tx.update(classInstances).set({ quotaDeducted: false }).where(eq(classInstances.id, id2));
        // Force students classesRemaining to 0 just in case
        await tx.update(students).set({ classesRemaining: 0 }).where(eq(students.id, s2.id));

        await expectRepositoryError(() => SchedulingRepository.updateClassInstance(id2, { quotaDeducted: true }, tx));

        // 3. updateClassInstance swapping to student with 0 quota
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

        // Add assignment for s4 to the same teacher
        await tx.insert(teacherAssignments).values({
          studentId: s4.id,
          teacherId: t3,
          assignedAt: new Date(),
        });

        // Ensure quotaDeducted is true on the original class instance
        await tx.update(classInstances).set({ quotaDeducted: true }).where(eq(classInstances.id, id3));

        await expectRepositoryError(() => SchedulingRepository.updateClassInstance(id3, { studentId: s4.id }, tx));
      });
    });

    test("getClassStatusEvents and getTeacherProgressFeed work successfully", async () => {
      await runInRollback(async tx => {
        const { instance, teacher } = await setupTestEntities(tx, "EventsFeed");
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        // Trigger state change to create classStatusEvents
        await SchedulingRepository.activateClassInstance(id, u, { force: false }, tx);

        // Test getClassStatusEvents
        const events = await SchedulingRepository.getClassStatusEvents(id, tx);
        expect(events.length).toBeGreaterThan(0);

        // Test getTeacherProgressFeed
        const feed = await SchedulingRepository.getTeacherProgressFeed(teacher.id, new Date(), tx);
        expect(feed.length).toBeGreaterThan(0);
        expect(feed[0].id).toBe(events[0].id);

        // Non-transactional calls
        const feedNoTx = await SchedulingRepository.getTeacherProgressFeed(teacher.id, new Date());
        expect(Array.isArray(feedNoTx)).toBe(true);

        const eventsNoTx = await SchedulingRepository.getClassStatusEvents(id);
        expect(Array.isArray(eventsNoTx)).toBe(true);
      });
    });

    test("resetClassInstance restores quota if quotaDeducted was true", async () => {
      await runInRollback(async tx => {
        const { instance, student, teacher } = await setupTestEntities(tx, "ResetQ", { skipInstance: false });
        const id = instance?.id;
        const u = teacher.userId;
        if (!id || !u) throw new Error("setup error");

        // Set quotaDeducted to true and record initial classesRemaining
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

        // Ensure student has a teacher assignment
        await tx.insert(teacherAssignments).values({
          studentId: student.id,
          teacherId: teacher.id,
          assignedAt: new Date(),
        });

        const instance = await createMockClassInstance(tx, student.id, teacher.id);

        // Parent of student should bypass IDOR check successfully
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
        await expectRepositoryError(() => SchedulingRepository.processClassLeave(fakeId, "Sick", "some-actor-id", tx));
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

        await SchedulingRepository.processClassLeave(id, "Sick leave", u, tx, "en");

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

        await expectRepositoryError(() => SchedulingRepository.processClassLeave(id, "Third leave", u, tx, "en"));
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
        await SchedulingRepository.processClassLeave(instance1.id, "Leave 1", teacher.userId, tx, "en");

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
        await SchedulingRepository.processClassLeave(instance2.id, "Leave 2", teacher.userId, tx, "en");

        const usage2 = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacher.id, currentYear, currentMonth, tx);
        expect(usage2).toBe(2);
      });
    });
  });
});
