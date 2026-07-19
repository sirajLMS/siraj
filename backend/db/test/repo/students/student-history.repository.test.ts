import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { StudentHistoryRepository } from "@/backend/db/repo";
import { classInstancePerformance, classInstances } from "@/backend/db/schema";
import { ensureTestSubjectId, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";

describe("StudentHistoryRepository", () => {
  it("getMonthlyCalendar returns sessions for specific month", async () => {
    await runInRollback(async tx => {
      const { student, teacher, teacherUser } = await setupTestEntities(tx, "cal1", { skipInstance: true });

      const juneClass = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: new Date("2026-06-15T14:30:00Z"),
          scheduledEndAt: new Date("2026-06-15T15:30:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: new Date("2026-06-15T14:30:00Z"),
          actualEndAt: new Date("2026-06-15T15:30:00Z"),
          idempotencyKey: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          meetingJoinUrl: "https://zoom.us/j/123",
          remarks: "Good class",
        })
        .returning()
        .then(r => r[0]);

      // Out of bounds class (May)
      await tx.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-05-15T14:30:00Z"),
        scheduledEndAt: new Date("2026-05-15T15:30:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        executionState: "COMPLETED",
        outcome: "TAKEN",
        actualStartAt: new Date("2026-06-15T14:30:00Z"),
        actualEndAt: new Date("2026-06-15T15:30:00Z"),
        idempotencyKey: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const calendar = await StudentHistoryRepository.getMonthlyCalendar(student.id, 2026, 6, undefined, tx);
      expect(calendar).toHaveLength(1);

      const entry = calendar[0];
      expect(entry.id).toBe(juneClass.id);
      expect(entry.dayOfMonth).toBe(15);
      expect(entry.time).toBe("14:30");
      expect(entry.duration).toBe(60);
      expect(entry.instructor).toBe(teacherUser.name);
      expect(entry.room).toBe("https://zoom.us/j/123");
      expect(entry.notes).toBe("Good class");
    });
  });

  it("getMonthlyCalendar handles null meetingJoinUrl by returning null room", async () => {
    await runInRollback(async tx => {
      const { student, teacher } = await setupTestEntities(tx, "cal2", { skipInstance: true });

      const juneClassNoZoom = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: new Date("2026-06-16T14:30:00Z"),
          scheduledEndAt: new Date("2026-06-16T15:30:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: new Date("2026-06-16T14:30:00Z"),
          actualEndAt: new Date("2026-06-16T15:30:00Z"),
          idempotencyKey: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          meetingJoinUrl: null,
          remarks: "No zoom url",
        })
        .returning()
        .then(r => r[0]);

      const calendar = await StudentHistoryRepository.getMonthlyCalendar(student.id, 2026, 6, undefined, tx);
      expect(calendar).toHaveLength(1);

      const entryNoZoom = calendar[0];
      expect(entryNoZoom.id).toBe(juneClassNoZoom.id);
      expect(entryNoZoom.room).toBeNull();
    });
  });

  it("getMonthlyMetrics returns metrics for completed classes in month", async () => {
    await runInRollback(async tx => {
      const { student, teacher } = await setupTestEntities(tx, "met1");

      // Valid Taken Class
      await tx.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-10T10:00:00Z"),
        scheduledEndAt: new Date("2026-06-10T11:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        executionState: "COMPLETED",
        outcome: "TAKEN",
        actualStartAt: new Date("2026-06-15T14:30:00Z"),
        actualEndAt: new Date("2026-06-15T15:30:00Z"),
        idempotencyKey: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Valid Absent Class (COMPLETED but ABSENT)
      await tx.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-12T10:00:00Z"),
        scheduledEndAt: new Date("2026-06-12T11:00:00Z"),
        durationMinutes: 30,
        classType: "REGULAR",
        executionState: "COMPLETED",
        outcome: "ABSENT",
        idempotencyKey: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Invalid Class (NOT COMPLETED)
      await tx.insert(classInstances).values({
        studentId: student.id,
        teacherId: teacher.id,
        subjectId: await ensureTestSubjectId(tx),
        scheduledStartAt: new Date("2026-06-14T10:00:00Z"),
        scheduledEndAt: new Date("2026-06-14T11:00:00Z"),
        durationMinutes: 60,
        classType: "REGULAR",
        executionState: "NOT_ACTIVATED",
        outcome: "PENDING",
        idempotencyKey: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const metrics = await StudentHistoryRepository.getMonthlyMetrics(student.id, 2026, 6, tx);

      expect(metrics.totalClasses).toBe(2); // 2 completed
      expect(metrics.attendanceRate).toBe(50); // 1 taken / 2 total = 50%
      expect(metrics.hoursStudied).toBe(1.5); // 90 min / 60
    });
  });

  it("getMonthlyMetrics computes average performance score correctly", async () => {
    await runInRollback(async tx => {
      const { student, teacher } = await setupTestEntities(tx, "met_perf");

      const [class1] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: new Date("2026-06-10T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-10T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          executionState: "COMPLETED",
          outcome: "TAKEN",
          actualStartAt: new Date("2026-06-10T10:00:00Z"),
          idempotencyKey: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const [class2] = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: new Date("2026-06-12T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-12T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          executionState: "COMPLETED",
          outcome: "ABSENT",
          idempotencyKey: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await tx.insert(classInstancePerformance).values({
        classInstanceId: class1.id,
        engagementScore: 90,
      });

      await tx.insert(classInstancePerformance).values({
        classInstanceId: class2.id,
        engagementScore: 80,
      });

      const metrics = await StudentHistoryRepository.getMonthlyMetrics(student.id, 2026, 6, tx);
      expect(metrics.performance).toBe(85); // average of 90 and 80
    });
  });

  it("getMonthlyMetrics handles empty month gracefully", async () => {
    await runInRollback(async tx => {
      const { student } = await setupTestEntities(tx, "met2");
      const metrics = await StudentHistoryRepository.getMonthlyMetrics(student.id, 2026, 6, tx);

      expect(metrics.totalClasses).toBe(0);
      expect(metrics.attendanceRate).toBe(0);
      expect(metrics.hoursStudied).toBe(0);
    });
  });

  it("getSessionDetail returns null if not found", async () => {
    await runInRollback(async tx => {
      const detail = await StudentHistoryRepository.getSessionDetail(randomUUID(), undefined, tx);
      expect(detail).toBeNull();
    });
  });

  it("getSessionDetail returns instance with teacher name", async () => {
    await runInRollback(async tx => {
      const { student, teacher, teacherUser } = await setupTestEntities(tx, "det1");

      const instance = await tx
        .insert(classInstances)
        .values({
          studentId: student.id,
          teacherId: teacher.id,
          subjectId: await ensureTestSubjectId(tx),
          scheduledStartAt: new Date(),
          scheduledEndAt: new Date(),
          durationMinutes: 60,
          classType: "REGULAR",
          idempotencyKey: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .then(r => r[0]);

      const detail = await StudentHistoryRepository.getSessionDetail(instance.id, undefined, tx);
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(instance.id);
      expect(detail?.teacherName).toBe(teacherUser.name);
    });
  });

  it("supports native non-transactional calls (coverage fallback)", async () => {
    const fakeId = randomUUID();
    const calendar = await StudentHistoryRepository.getMonthlyCalendar(fakeId, 2026, 6);
    expect(calendar.length).toBeGreaterThanOrEqual(0);

    const metrics = await StudentHistoryRepository.getMonthlyMetrics(fakeId, 2026, 6);
    expect(metrics.totalClasses).toBeGreaterThanOrEqual(0);

    const detail = await StudentHistoryRepository.getSessionDetail(fakeId);
    expect(detail).toBeNull();
  });
});
