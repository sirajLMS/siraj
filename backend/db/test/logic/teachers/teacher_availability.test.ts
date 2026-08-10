import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { SchedulingRepository, TeacherAvailabilityRepository } from "@/backend/db/repo";
import { parents, students, teacherAssignments, teachers, users } from "@/backend/db/schema";
import { ensureTestSubjectId } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { DayOfWeek, Gender, VacationRequestStatus } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { StudentSelectType, TeacherSelectType, UserSelectType } from "@/backend/types";

async function createTestUser(tx: DBTransaction, name: string, emailPrefix: string): Promise<UserSelectType> {
  const now = new Date();
  const [user] = await tx
    .insert(users)
    .values({
      name,
      email: `${emailPrefix}-${randomUUID()}@example.com`,
      password: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!user) {
    throw new Error("Failed to create test user");
  }
  return user;
}

async function createBookingFixture(tx: DBTransaction): Promise<{
  teacher: TeacherSelectType;
  student: StudentSelectType;
  teacherUser: UserSelectType;
  adminUser: UserSelectType;
}> {
  const now = new Date();

  const teacherUser = await createTestUser(tx, "Availability Teacher", "teacher-avail");
  const adminUser = await createTestUser(tx, "Availability Admin", "admin-avail");
  const parentUser = await createTestUser(tx, "Availability Parent", "parent-avail");

  const [parent] = await tx
    .insert(parents)
    .values({
      userId: parentUser.id,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!parent) {
    throw new Error("Failed to create test parent");
  }

  const [teacher] = await tx
    .insert(teachers)
    .values({
      userId: teacherUser.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!teacher) {
    throw new Error("Failed to create test teacher");
  }

  const studentUser = await createTestUser(tx, "Availability Student User", "student-avail");

  const [student] = await tx
    .insert(students)
    .values({
      parentId: parent.id,
      userId: studentUser.id,
      name: "Availability Student",
      gender: Gender.MALE,
      status: "REGULAR",
      classesRemaining: 5,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: randomUUID(),
    })
    .returning();
  if (!student) {
    throw new Error("Failed to create test student");
  }

  await tx.insert(teacherAssignments).values({
    studentId: student.id,
    teacherId: teacher.id,
    assignedAt: now,
  });

  return { teacher, student, teacherUser, adminUser };
}

async function createTestClassInstance(args: {
  tx: DBTransaction;
  studentId: string;
  teacherId: string;
  start: string | Date;
  end: string | Date;
}) {
  const { tx, studentId, teacherId, start, end } = args;
  return SchedulingRepository.createClassInstance(
    {
      studentId,
      teacherId,
      subjectId: await ensureTestSubjectId(tx),
      scheduledStartAt: typeof start === "string" ? new Date(start) : start,
      scheduledEndAt: typeof end === "string" ? new Date(end) : end,
      durationMinutes: 60,
      classType: "REGULAR",
      quotaDeducted: false,
      idempotencyKey: randomUUID(),
    },
    tx
  );
}

async function expectBookingToFail(args: {
  tx: DBTransaction;
  studentId: string;
  teacherId: string;
  start: string;
  end: string;
  expectedError: string;
}) {
  const { tx, studentId, teacherId, start, end, expectedError } = args;
  let bookingError: Error | null = null;
  try {
    await createTestClassInstance({ tx, studentId, teacherId, start, end });
  } catch (error) {
    if (error instanceof Error) {
      bookingError = error;
    } else {
      throw new Error(String(error), { cause: error });
    }
  }
  if (bookingError) {
    expect(bookingError.message).toContain(expectedError);
  } else {
    throw new Error(`Expected booking to fail with error containing "${expectedError}", but it succeeded`);
  }
}

async function submitTestVacation(args: {
  tx: DBTransaction;
  teacherId: string;
  userId: string;
  start: string;
  end: string;
  reason?: string;
}) {
  return TeacherAvailabilityRepository.submitVacationRequest(
    {
      startAt: new Date(args.start),
      endAt: new Date(args.end),
      timezone: IanaTimezone.UTC,
      reason: args.reason,
    },
    args.userId,
    args.teacherId,
    args.tx
  );
}

async function runTestInFixture(
  fn: (tx: DBTransaction, fixture: Awaited<ReturnType<typeof createBookingFixture>>) => Promise<void>
) {
  await runInRollback(async tx => {
    const fixture = await createBookingFixture(tx);
    await fn(tx, fixture);
  });
}

describe("Teacher Availability & Vacation Workflow", () => {
  test("Allows booking within defined availability window", () =>
    runTestInFixture(async (tx, { teacher, student }) => {
      await TeacherAvailabilityRepository.addAvailabilityWindow(
        teacher.id,
        {
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: "09:00:00",
          endTime: "17:00:00",
          timezone: IanaTimezone.UTC,
        },
        tx
      );

      const booking = await createTestClassInstance({
        tx,
        studentId: student.id,
        teacherId: teacher.id,
        start: "2026-06-24T10:00:00Z",
        end: "2026-06-24T11:00:00Z",
      });

      expect(booking.id).toBeDefined();
    }));

  test("Blocks booking outside defined availability windows", () =>
    runTestInFixture(async (tx, { teacher, student }) => {
      await TeacherAvailabilityRepository.addAvailabilityWindow(
        teacher.id,
        {
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: "09:00:00",
          endTime: "12:00:00",
          timezone: IanaTimezone.UTC,
        },
        tx
      );

      await expectBookingToFail({
        tx,
        studentId: student.id,
        teacherId: teacher.id,
        start: "2026-06-24T14:00:00Z",
        end: "2026-06-24T15:00:00Z",
        expectedError: "خارج نوافذ توفر المعلم",
      });
    }));

  test("Blocks booking during recurring unavailability pattern", () =>
    runTestInFixture(async (tx, { teacher, student }) => {
      await TeacherAvailabilityRepository.addRecurringUnavailability(
        teacher.id,
        {
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: "12:00:00",
          endTime: "14:00:00",
          timezone: IanaTimezone.UTC,
          reason: "Lunch break",
        },
        tx
      );

      await expectBookingToFail({
        tx,
        studentId: student.id,
        teacherId: teacher.id,
        start: "2026-06-26T12:30:00Z",
        end: "2026-06-26T13:30:00Z",
        expectedError: "نمط عدم التفرغ المتكرر",
      });
    }));

  test("Blocks booking during approved vacation but not pending vacation", () =>
    runTestInFixture(async (tx, { teacher, student, teacherUser, adminUser }) => {
      const vacation = await submitTestVacation({
        tx,
        teacherId: teacher.id,
        userId: teacherUser.id,
        start: "2026-07-01T00:00:00Z",
        end: "2026-07-10T23:59:59Z",
        reason: "Summer vacation",
      });

      expect(vacation.status).toBe(VacationRequestStatus.PENDING);

      const pendingBooking = await createTestClassInstance({
        tx,
        studentId: student.id,
        teacherId: teacher.id,
        start: "2026-07-05T10:00:00Z",
        end: "2026-07-05T11:00:00Z",
      });

      expect(pendingBooking.id).toBeDefined();

      const approved = await TeacherAvailabilityRepository.approveVacationRequest(
        {
          vacationRequestId: vacation.id,
        },
        adminUser.id,
        tx
      );

      expect(approved.status).toBe(VacationRequestStatus.APPROVED);

      await expectBookingToFail({
        tx,
        studentId: student.id,
        teacherId: teacher.id,
        start: "2026-07-06T10:00:00Z",
        end: "2026-07-06T11:00:00Z",
        expectedError: "إجازة معتمدة",
      });
    }));

  test("Supports vacation rejection and cancellation workflow", () =>
    runTestInFixture(async (tx, { teacher, teacherUser, adminUser }) => {
      const vacation = await submitTestVacation({
        tx,
        teacherId: teacher.id,
        userId: teacherUser.id,
        start: "2026-08-01T00:00:00Z",
        end: "2026-08-05T23:59:59Z",
      });

      const rejected = await TeacherAvailabilityRepository.rejectVacationRequest(
        {
          vacationRequestId: vacation.id,
        },
        adminUser.id,
        tx
      );

      expect(rejected.status).toBe(VacationRequestStatus.REJECTED);

      const secondVacation = await submitTestVacation({
        tx,
        teacherId: teacher.id,
        userId: teacherUser.id,
        start: "2026-09-01T00:00:00Z",
        end: "2026-09-05T23:59:59Z",
      });

      const cancelled = await TeacherAvailabilityRepository.cancelVacationRequest(secondVacation.id, tx);
      expect(cancelled.status).toBe(VacationRequestStatus.CANCELLED);
    }));
});
