import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { DayOfWeek, Gender, VacationRequestStatus } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { ParentEntity, StudentEntity, TeacherEntity, UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { SchedulingRepository, TeacherAvailabilityRepository } from "../repo";
import { parents, students, teacherAssignments, teachers, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

async function createBookingFixture(tx: DbTransaction): Promise<{
  teacher: TeacherEntity;
  student: StudentEntity;
  teacherUser: UserEntity;
  adminUser: UserEntity;
}> {
  const now = new Date();

  const [teacherUser] = (await tx
    .insert(users)
    .values({
      name: "Availability Teacher",
      email: `teacher-avail-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];

  const [adminUser] = (await tx
    .insert(users)
    .values({
      name: "Availability Admin",
      email: `admin-avail-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];

  const [parentUser] = (await tx
    .insert(users)
    .values({
      name: "Availability Parent",
      email: `parent-avail-${randomUUID()}@example.com`,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];

  const [parent] = (await tx
    .insert(parents)
    .values({
      userId: parentUser.id,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [ParentEntity];

  const [teacher] = (await tx
    .insert(teachers)
    .values({
      userId: teacherUser.id,
      status: "ACTIVATED",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [TeacherEntity];

  const [student] = (await tx
    .insert(students)
    .values({
      parentId: parent.id,
      name: "Availability Student",
      gender: Gender.MALE,
      status: "REGULAR",
      classesRemaining: 5,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: randomUUID(),
    })
    .returning()) as [StudentEntity];

  await tx.insert(teacherAssignments).values({
    studentId: student.id,
    teacherId: teacher.id,
    assignedAt: now,
  });

  return { teacher, student, teacherUser, adminUser };
}

describe("Teacher Availability & Vacation Workflow", () => {
  test("Allows booking within defined availability window", async () => {
    testLogger.info("Testing booking within availability window...");
    await runInRollback(async tx => {
      const { teacher, student } = await createBookingFixture(tx);

      await TeacherAvailabilityRepository.addAvailabilityWindow(
        {
          teacherId: teacher.id,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: "09:00:00",
          endTime: "17:00:00",
          timezone: "UTC",
        },
        tx
      );

      const booking = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-06-24T10:00:00Z"),
          scheduledEndAt: new Date("2026-06-24T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: false,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      expect(booking.id).toBeDefined();
    });
    testLogger.info("Availability window booking test passed.");
  });

  test("Blocks booking outside defined availability windows", async () => {
    testLogger.info("Testing booking outside availability window...");
    await runInRollback(async tx => {
      const { teacher, student } = await createBookingFixture(tx);

      await TeacherAvailabilityRepository.addAvailabilityWindow(
        {
          teacherId: teacher.id,
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: "09:00:00",
          endTime: "12:00:00",
          timezone: "UTC",
        },
        tx
      );

      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-24T14:00:00Z"),
            scheduledEndAt: new Date("2026-06-24T15:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            quotaDeducted: false,
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain("outside teacher availability windows");
      }
    });
    testLogger.info("Outside availability window test passed.");
  });

  test("Blocks booking during recurring unavailability pattern", async () => {
    testLogger.info("Testing recurring unavailability block...");
    await runInRollback(async tx => {
      const { teacher, student } = await createBookingFixture(tx);

      await TeacherAvailabilityRepository.addRecurringUnavailability(
        {
          teacherId: teacher.id,
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: "12:00:00",
          endTime: "14:00:00",
          timezone: "UTC",
          reason: "Lunch break",
        },
        tx
      );

      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-06-26T12:30:00Z"),
            scheduledEndAt: new Date("2026-06-26T13:30:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            quotaDeducted: false,
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain("recurring unavailability");
      }
    });
    testLogger.info("Recurring unavailability test passed.");
  });

  test("Blocks booking during approved vacation but not pending vacation", async () => {
    testLogger.info("Testing vacation request workflow...");
    await runInRollback(async tx => {
      const { teacher, student, teacherUser, adminUser } = await createBookingFixture(tx);

      const vacation = await TeacherAvailabilityRepository.submitVacationRequest(
        {
          teacherId: teacher.id,
          requestedByUserId: teacherUser.id,
          startAt: new Date("2026-07-01T00:00:00Z"),
          endAt: new Date("2026-07-10T23:59:59Z"),
          timezone: "UTC",
          reason: "Summer vacation",
        },
        tx
      );

      expect(vacation.status).toBe(VacationRequestStatus.PENDING);

      const pendingBooking = await SchedulingRepository.createClassInstance(
        {
          studentId: student.id,
          teacherId: teacher.id,
          scheduledStartAt: new Date("2026-07-05T10:00:00Z"),
          scheduledEndAt: new Date("2026-07-05T11:00:00Z"),
          durationMinutes: 60,
          classType: "REGULAR",
          quotaDeducted: false,
          idempotencyKey: randomUUID(),
        },
        tx
      );

      expect(pendingBooking.id).toBeDefined();

      const approved = await TeacherAvailabilityRepository.approveVacationRequest(
        {
          vacationRequestId: vacation.id,
          processedByUserId: adminUser.id,
        },
        tx
      );

      expect(approved.status).toBe(VacationRequestStatus.APPROVED);

      try {
        await SchedulingRepository.createClassInstance(
          {
            studentId: student.id,
            teacherId: teacher.id,
            scheduledStartAt: new Date("2026-07-06T10:00:00Z"),
            scheduledEndAt: new Date("2026-07-06T11:00:00Z"),
            durationMinutes: 60,
            classType: "REGULAR",
            quotaDeducted: false,
            idempotencyKey: randomUUID(),
          },
          tx
        );
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain("approved vacation");
      }
    });
    testLogger.info("Vacation workflow test passed.");
  });

  test("Supports vacation rejection and cancellation workflow", async () => {
    testLogger.info("Testing vacation rejection and cancellation...");
    await runInRollback(async tx => {
      const { teacher, teacherUser, adminUser } = await createBookingFixture(tx);

      const vacation = await TeacherAvailabilityRepository.submitVacationRequest(
        {
          teacherId: teacher.id,
          requestedByUserId: teacherUser.id,
          startAt: new Date("2026-08-01T00:00:00Z"),
          endAt: new Date("2026-08-05T23:59:59Z"),
          timezone: "UTC",
        },
        tx
      );

      const rejected = await TeacherAvailabilityRepository.rejectVacationRequest(
        {
          vacationRequestId: vacation.id,
          processedByUserId: adminUser.id,
        },
        tx
      );

      expect(rejected.status).toBe(VacationRequestStatus.REJECTED);

      const secondVacation = await TeacherAvailabilityRepository.submitVacationRequest(
        {
          teacherId: teacher.id,
          requestedByUserId: teacherUser.id,
          startAt: new Date("2026-09-01T00:00:00Z"),
          endAt: new Date("2026-09-05T23:59:59Z"),
          timezone: "UTC",
        },
        tx
      );

      const cancelled = await TeacherAvailabilityRepository.cancelVacationRequest(secondVacation.id, tx);
      expect(cancelled.status).toBe(VacationRequestStatus.CANCELLED);
    });
    testLogger.info("Vacation rejection and cancellation test passed.");
  });
});
