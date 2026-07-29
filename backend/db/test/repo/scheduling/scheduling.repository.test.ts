import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { SchedulingRepository } from "@/backend/db/repo";
import {
  classInstances,
  classStatusEvents,
  students,
  systemSettings,
  teacherAssignments,
  users,
} from "@/backend/db/schema";
import {
  createMockClassInstance,
  createTestMeetingConfig,
  createTestMeetingProvider,
  ensureTestSubjectId,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { testRepoError } from "@/backend/db/test/repo/scheduling/scheduling-test-helpers";
import { runInRollback } from "@/backend/db/test/test-utils";
import { SystemSettingCategory, SystemSettingDataType } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";

interface ClassStatusEventState {
  executionState?: string;
  outcome?: string;
  deleted?: boolean;
}

describe("Scheduling Repository — CRUD & Queries", () => {
  describe("createClassInstance", () => {
    const getCreatePayload = async (
      tx: DBTransaction,
      studentId: string,
      teacherId: string,
      start: Date,
      end: Date,
      overrides: Partial<typeof classInstances.$inferInsert> = {}
    ) => {
      const subjectId = overrides.subjectId ?? (await ensureTestSubjectId(tx));
      return {
        studentId,
        teacherId,
        scheduledStartAt: start,
        scheduledEndAt: end,
        durationMinutes: 60,
        classType: "REGULAR" as const,
        idempotencyKey: randomUUID(),
        ...overrides,
        subjectId,
      };
    };

    test("creates successfully with valid data and handles quota deduction", async () => {
      await runInRollback(async tx => {
        const { student, teacher, now } = await setupTestEntities(tx, "Create1", { skipInstance: true });
        const [studentBefore] = await tx.select().from(students).where(eq(students.id, student.id));

        const start = new Date(now.getTime() + 86400000);
        const end = new Date(start.getTime() + 3600000);

        const created = await SchedulingRepository.createClassInstance(
          await getCreatePayload(tx, student.id, teacher.id, start, end, { quotaDeducted: true }),
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
        await getCreatePayload(
          tx,
          student.id,
          teacher.id,
          new Date(now.getTime() + 86400000),
          new Date(now.getTime() + 90000000)
        ),
        tx
      );
    });

    const expectOverlapError = async (
      tx: DBTransaction,
      firstEntities: { studentId: string; teacherId: string },
      secondEntities: { studentId: string; teacherId: string },
      assignedAt: Date
    ) => {
      const now = new Date(assignedAt.getTime() + 86400000);
      const end = new Date(now.getTime() + 3600000);
      await createMockClassInstance(tx, firstEntities.studentId, firstEntities.teacherId, {
        scheduledStartAt: now,
        scheduledEndAt: end,
      });
      await tx.insert(teacherAssignments).values({
        studentId: secondEntities.studentId,
        teacherId: secondEntities.teacherId,
        assignedAt,
      });
      await SchedulingRepository.createClassInstance(
        await getCreatePayload(tx, secondEntities.studentId, secondEntities.teacherId, now, end),
        tx
      );
    };

    const setupOverlapScenario = async (
      tx: DBTransaction,
      firstPrefix: string,
      secondPrefix: string,
      variant: "teacher" | "student"
    ) => {
      const first = await setupTestEntities(tx, firstPrefix);
      const second = await setupTestEntities(tx, secondPrefix);
      const firstEntities = { studentId: first.student.id, teacherId: first.teacher.id };
      const secondEntities =
        variant === "teacher"
          ? { studentId: second.student.id, teacherId: first.teacher.id }
          : { studentId: first.student.id, teacherId: second.teacher.id };
      return { first, second, firstEntities, secondEntities, now: first.now };
    };

    testRepoError("throws on teacher overlap", async tx => {
      const { firstEntities, secondEntities, now } = await setupOverlapScenario(tx, "Create3", "Create4", "teacher");
      await expectOverlapError(tx, firstEntities, secondEntities, now);
    });

    testRepoError("throws on student overlap", async tx => {
      const { firstEntities, secondEntities, now } = await setupOverlapScenario(
        tx,
        "CreateStudentOver",
        "CreateStudentOver2",
        "student"
      );
      await expectOverlapError(tx, firstEntities, secondEntities, now);
    });

    testRepoError("throws on zoomUrl overlap", async tx => {
      const { student, teacher, now } = await setupTestEntities(tx, "CreateZoom");
      const start = new Date(now.getTime() + 86400000);
      const end = new Date(start.getTime() + 3600000);
      const zoomUrl = "https://zoom.us/j/123456789";
      // Create first instance with a meeting config
      const provider = await createTestMeetingProvider(tx, { slug: `zoom-${randomUUID().slice(0, 8)}` });
      const config = await createTestMeetingConfig(tx, teacher.userId, provider.id, {
        details: { meetingUrl: zoomUrl },
        isDefault: true,
      });
      await createMockClassInstance(tx, student.id, teacher.id, {
        scheduledStartAt: start,
        scheduledEndAt: end,
        userMeetingConfigId: config.id,
        meetingJoinUrl: zoomUrl,
      });
      const { student: s2, teacher: t2 } = await setupTestEntities(tx, "CreateZoom2");
      // Create a meeting config for the second teacher with the same zoom URL
      const provider2 = await createTestMeetingProvider(tx, { slug: `zoom-${randomUUID().slice(0, 8)}` });
      const config2 = await createTestMeetingConfig(tx, t2.userId, provider2.id, {
        details: { meetingUrl: zoomUrl },
        isDefault: true,
      });
      await SchedulingRepository.createClassInstance(
        await getCreatePayload(tx, s2.id, t2.id, start, end, {
          userMeetingConfigId: config2.id,
          meetingJoinUrl: zoomUrl,
        }),
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
    const getReschedulePayload = async (
      tx: DBTransaction,
      studentId: string,
      teacherId: string,
      overrides: Partial<typeof classInstances.$inferInsert> = {}
    ) => {
      const subjectId = overrides.subjectId ?? (await ensureTestSubjectId(tx));
      return {
        studentId,
        teacherId,
        scheduledStartAt: new Date(),
        scheduledEndAt: new Date(),
        durationMinutes: 60,
        classType: "REGULAR" as const,
        idempotencyKey: randomUUID(),
        ...overrides,
        subjectId,
      };
    };

    testRepoError("throws if original class not found", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched1");
      await SchedulingRepository.rescheduleClassInstance(
        randomUUID(),
        await getReschedulePayload(tx, student.id, teacher.id),
        tx
      );
    });

    testRepoError("throws if rescheduling to self", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched2");
      const instance = await createMockClassInstance(tx, student.id, teacher.id);
      await SchedulingRepository.rescheduleClassInstance(
        instance.id,
        await getReschedulePayload(tx, student.id, teacher.id, { id: instance.id }),
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
      await SchedulingRepository.rescheduleClassInstance(
        instance.id,
        await getReschedulePayload(tx, student.id, teacher.id),
        tx
      );
    });

    testRepoError("throws if already rescheduled", async tx => {
      const { student, teacher } = await setupTestEntities(tx, "Resched4");
      const instance = await createMockClassInstance(tx, student.id, teacher.id, { isRescheduled: true });
      await SchedulingRepository.rescheduleClassInstance(
        instance.id,
        await getReschedulePayload(tx, student.id, teacher.id),
        tx
      );
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
          await getReschedulePayload(tx, student.id, teacher.id, { scheduledStartAt: start, scheduledEndAt: end }),
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
        expect(newSchedule).toHaveLength(initialSchedule.length + 2);

        const scheduledClass = newSchedule.find(s => s.classType === "REGULAR");
        expect(scheduledClass?.student).toBeDefined();
        expect(scheduledClass?.teacher).toBeDefined();
      });
    });

    test("filters daily schedule by metric filter using dashboard status", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "MetricFilter");
        const testDate = new Date("2028-02-01T12:00:00Z");

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
          outcome: "PENDING",
          executionState: "RUNNING",
        });
        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: testDate,
          scheduledEndAt: new Date(testDate.getTime() + 3600000),
          classType: "REGULAR",
          outcome: "TAKEN",
          executionState: "COMPLETED",
          actualStartAt: testDate,
          actualEndAt: new Date(testDate.getTime() + 3600000),
        });

        const dashboard = await SchedulingRepository.getAdminDashboardSchedule(
          {
            date: testDate,
            teacherId: teacher.id,
            viewerTimezone: IanaTimezone.UTC,
          },
          tx
        );

        expect(dashboard.metrics.pending).toBeGreaterThanOrEqual(1);
        expect(dashboard.metrics.running).toBeGreaterThanOrEqual(1);
        expect(dashboard.metrics.taken).toBeGreaterThanOrEqual(1);

        const pendingRows = await SchedulingRepository.getDailySchedule(
          testDate,
          { teacherId: teacher.id, metricFilter: "pending" },
          tx
        );
        const runningRows = await SchedulingRepository.getDailySchedule(
          testDate,
          { teacherId: teacher.id, metricFilter: "running" },
          tx
        );

        expect(pendingRows.every(row => row.outcome === "PENDING" && row.executionState === "NOT_ACTIVATED")).toBe(
          true
        );
        expect(runningRows.some(row => row.executionState === "RUNNING")).toBe(true);
      });
    });

    test("search narrows admin dashboard metrics and rows", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "MetricSearch");
        const testDate = new Date("2028-03-01T12:00:00Z");

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: testDate,
          scheduledEndAt: new Date(testDate.getTime() + 3600000),
          outcome: "PENDING",
        });

        const allDashboard = await SchedulingRepository.getAdminDashboardSchedule(
          {
            date: testDate,
            teacherId: teacher.id,
            viewerTimezone: IanaTimezone.UTC,
          },
          tx
        );
        const searchedDashboard = await SchedulingRepository.getAdminDashboardSchedule(
          {
            date: testDate,
            teacherId: teacher.id,
            search: student.name,
            viewerTimezone: IanaTimezone.UTC,
          },
          tx
        );

        expect(searchedDashboard.metrics.total).toBeLessThanOrEqual(allDashboard.metrics.total);
        expect(searchedDashboard.rows.length).toBeGreaterThanOrEqual(1);
      });
    });

    test("filters daily schedule by metric filter", async () => {
      await runInRollback(async tx => {
        const { student, teacher } = await setupTestEntities(tx, "MetricFilter");
        const testDate = new Date("2028-02-01T12:00:00Z");

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: testDate,
          scheduledEndAt: new Date(testDate.getTime() + 3600000),
          classType: "REGULAR",
          outcome: "PENDING",
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

        const allRows = await SchedulingRepository.getDailySchedule(testDate, { teacherId: teacher.id }, tx);
        const regularRows = await SchedulingRepository.getDailySchedule(
          testDate,
          { teacherId: teacher.id, metricFilter: "regular" },
          tx
        );
        const trialRows = await SchedulingRepository.getDailySchedule(
          testDate,
          { teacherId: teacher.id, metricFilter: "trial" },
          tx
        );

        expect(regularRows.length).toBeGreaterThanOrEqual(1);
        expect(trialRows.length).toBeGreaterThanOrEqual(1);
        expect(regularRows.length + trialRows.length).toBeLessThanOrEqual(allRows.length);
        expect(regularRows.every(row => row.classType === "REGULAR")).toBe(true);
        expect(trialRows.every(row => row.classType === "TRIAL")).toBe(true);
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
            dataType: SystemSettingDataType.String,
            description: "desc",
            category: SystemSettingCategory.Scheduling,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: { value: "Europe/Paris" },
          });

        await tx.update(users).set({ timezone: IanaTimezone.Africa_Cairo }).where(eq(users.id, parent.userId));

        let tz = await SchedulingRepository.resolveStudentTimezone(student.id, tx);
        expect(tz).toBe("Africa/Cairo");

        await tx.update(students).set({ timezoneOverride: "America/New_York" }).where(eq(students.id, student.id));
        tz = await SchedulingRepository.resolveStudentTimezone(student.id, tx);
        expect(tz).toBe("America/New_York");
      });
    });

    const expectStateTransitionEvent = async (
      tx: DBTransaction,
      instanceId: string,
      expectedState: ClassStatusEventState
    ) => {
      const [event] = await tx
        .select()
        .from(classStatusEvents)
        .where(eq(classStatusEvents.classInstanceId, instanceId));
      expect(event).toBeDefined();
      expect(event.eventType).toBe("STATE_CHANGE");
      expect((event.toState as ClassStatusEventState).executionState).toBe(expectedState.executionState);
      if (expectedState.outcome !== undefined) {
        expect((event.toState as ClassStatusEventState).outcome).toBe(expectedState.outcome);
      }
    };

    interface StateTransitionExpectations {
      executionState: string;
      outcome?: string;
      expectForceActivated?: boolean;
      expectActualEndAt?: boolean;
    }

    const runStateTransitionTest = async (
      tx: DBTransaction,
      prefix: string,
      instanceOverrides: Partial<typeof classInstances.$inferInsert>,
      transitionFn: (
        instanceId: string,
        userId: string,
        t: DBTransaction
      ) => Promise<typeof classInstances.$inferSelect | null>,
      expectations: StateTransitionExpectations
    ) => {
      const { student, teacher } = await setupTestEntities(tx, prefix);
      const instance = await createMockClassInstance(tx, student.id, teacher.id, instanceOverrides);
      const updated = await transitionFn(instance.id, teacher.userId, tx);
      if (!updated) throw new Error(`Failed to ${prefix} class instance`);

      expect(updated.executionState).toBe(expectations.executionState);
      if (expectations.outcome !== undefined) expect(updated.outcome).toBe(expectations.outcome);
      if (expectations.expectForceActivated) {
        expect(updated.forceActivated).toBe(true);
        expect(updated.forceActivatedByUserId).toBe(teacher.userId);
      }
      if (expectations.expectActualEndAt) expect(updated.actualEndAt).toBeDefined();

      await expectStateTransitionEvent(tx, instance.id, {
        executionState: expectations.executionState,
        outcome: expectations.outcome,
      });
      return updated;
    };

    test("activateClassInstance sets flags and creates event", async () => {
      await runInRollback(async tx => {
        const result = await runStateTransitionTest(
          tx,
          "activate",
          { executionState: "NOT_ACTIVATED" },
          (id, userId, t) => SchedulingRepository.activateClassInstance(id, userId, { force: true }, t),
          { executionState: "ACTIVATED", expectForceActivated: true }
        );
        expect(result.executionState).toBe("ACTIVATED");
      });
    });

    test("stopClassInstance sets flags and creates event", async () => {
      await runInRollback(async tx => {
        const result = await runStateTransitionTest(
          tx,
          "stop",
          { executionState: "RUNNING", actualStartAt: new Date() },
          (id, userId, t) => SchedulingRepository.stopClassInstance(id, userId, t),
          { executionState: "COMPLETED", outcome: "TAKEN", expectActualEndAt: true }
        );
        expect(result.executionState).toBe("COMPLETED");
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
        const { student, teacher, teacherUser } = await setupTestEntities(tx, "schSrch", { skipInstance: true });

        await tx.update(students).set({ name: "Searchable Student XYZ" }).where(eq(students.id, student.id));
        await tx.update(users).set({ name: "Unrelated Teacher Name" }).where(eq(users.id, teacherUser.id));

        const date = new Date("2026-06-19T10:00:00.000Z");

        await createMockClassInstance(tx, student.id, teacher.id, {
          scheduledStartAt: new Date("2026-06-19T12:00:00.000Z"),
          scheduledEndAt: new Date("2026-06-19T13:00:00.000Z"),
        });

        let schedule = await SchedulingRepository.getDailySchedule(
          date,
          {
            search: "XYZ",
            viewerTimezone: IanaTimezone.UTC,
          },
          tx
        );
        expect(schedule).toHaveLength(1);
        expect(schedule[0].yourTimeFormatted).toBe("12:00 PM");

        schedule = await SchedulingRepository.getDailySchedule(
          date,
          { search: "Unrelated", viewerTimezone: "Africa/Cairo" },
          tx
        );
        expect(schedule).toHaveLength(1);
        expect(schedule[0].yourTimeFormatted).toBe("03:00 PM");

        schedule = await SchedulingRepository.getDailySchedule(date, { search: "NoMatchHere" }, tx);
        expect(schedule).toHaveLength(0);
      });
    });
  });
});
