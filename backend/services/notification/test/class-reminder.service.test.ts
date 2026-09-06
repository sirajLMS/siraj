import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students";
import { CalculationStatus, NotificationChannel, StudentStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { ClassReminderService } from "@/backend/services/notification/class-reminder.service";
import * as notificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { ClassInstanceSelectType, StudentSelectType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";

const SCHEDULED_START = new Date("2026-09-04T10:00:00.000Z");
const SCHEDULED_END = new Date("2026-09-04T11:00:00.000Z");

function buildMockStudent(id: string, name: string): StudentSelectType {
  return {
    id,
    userId: `user-${id}`,
    parentId: null,
    primaryTeacherId: null,
    name,
    avatarUrl: null,
    dateOfBirth: null,
    gender: null,
    language: "en",
    timezoneOverride: null,
    status: StudentStatus.REGULAR,
    classesTotal: 10,
    classesRemaining: 8,
    creditHoursTotal: "20.00",
    creditHoursRemaining: "16.00",
    version: 1,
    hoursPerWeek: "2",
    idempotencyKey: `mock-${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const mockInstance1: ClassInstanceSelectType = {
  id: "instance-001",
  studentId: "student-101",
  teacherId: "teacher-201",
  subjectId: "subject-301",
  recurringScheduleId: null,
  originalClassId: null,
  scheduledStartAt: SCHEDULED_START,
  scheduledEndAt: SCHEDULED_END,
  bookingTimezoneId: null,
  bookingTimezone: "UTC",
  bookingUtcOffset: 0,
  durationMinutes: 60,
  classType: ClassType.REGULAR,
  outcome: ClassOutcome.PENDING,
  executionState: ClassExecutionState.NOT_ACTIVATED,
  billedUnit: null,
  isRescheduled: false,
  isFrozen: false,
  meetingJoinUrl: "https://example.com/meet/1",
  userMeetingConfigId: null,
  meetingProviderId: null,
  meetingConfigSnapshot: null,
  activatedAt: null,
  activatedByUserId: null,
  forceActivated: false,
  forceActivatedByUserId: null,
  actualStartAt: null,
  actualEndAt: null,
  quotaDeducted: true,
  schedulingMode: "AD_HOC",
  ondemandStatus: null,
  payrollCredited: false,
  rateAmount: null,
  rateCurrency: null,
  isRateOverridden: false,
  rateSource: null,
  calculatedDuration: null,
  teacherPaidAmount: null,
  teacherPaidCurrency: null,
  calculationStatus: CalculationStatus.NOT_CALCULATED,
  isPartialPercentage: null,
  payrollNote: null,
  payrollCalculatedAt: null,
  payrollCalculatedBy: null,
  carryoverBalanceId: null,
  remarks: null,
  adminNotes: null,
  idempotencyKey: "mock-ci",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockInstance2: ClassInstanceSelectType = {
  ...mockInstance1,
  id: "instance-002",
  studentId: "student-102",
};

const mockAffected1 = {
  instanceId: "instance-001",
  studentId: "student-101",
  teacherUserId: "teacher-201",
  parentUserId: "parent-301",
  studentUserId: "student-user-401",
};

const mockAffected2 = {
  instanceId: "instance-002",
  studentId: "student-102",
  teacherUserId: "teacher-202",
  parentUserId: "parent-302",
  studentUserId: "student-user-402",
};

describe("ClassReminderService.dispatchDailyReminders", () => {
  let loggerInfoSpy: ReturnType<typeof spyOn>;
  let loggerErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => logger);
    loggerErrorSpy = spyOn(logger, "error").mockImplementation(() => logger);
  });

  afterEach(() => {
    spyOn(SchedulingRepository, "findUpcomingInstances").mockRestore();
    spyOn(SchedulingRepository, "getClassInstanceAffectedUsers").mockRestore();
    spyOn(StudentRepository, "findById").mockRestore();
    spyOn(notificationDispatchHelpers, "dispatchWithPreferences").mockRestore();
    loggerInfoSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  test("happy path: processes upcoming instances and dispatches notifications", async () => {
    spyOn(SchedulingRepository, "findUpcomingInstances").mockResolvedValue([mockInstance1, mockInstance2]);
    spyOn(SchedulingRepository, "getClassInstanceAffectedUsers").mockImplementation(async (id: string) => {
      if (id === "instance-001") return mockAffected1;
      if (id === "instance-002") return mockAffected2;
      return null;
    });
    spyOn(StudentRepository, "findById").mockImplementation(async (id: string) => {
      return buildMockStudent(id, `Student ${id}`);
    });
    spyOn(notificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([
      { channel: NotificationChannel.EMAIL, success: true },
      { channel: NotificationChannel.ON_APP, success: true },
    ]);

    const result = await ClassReminderService.dispatchDailyReminders();

    expect(result).toEqual({
      success: true,
      instancesProcessed: 2,
      deliveriesDispatched: 4, // 2 successful deliveries per instance * 2 instances
    });

    expect(SchedulingRepository.findUpcomingInstances).toHaveBeenCalledWith({ withinHours: 24 });
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      "ClassReminderService.dispatchDailyReminders complete",
      expect.objectContaining({
        withinHours: 24,
        instancesProcessed: 2,
        deliveriesDispatched: 4,
      })
    );
  });

  test("forwards custom withinHours and locale parameters", async () => {
    spyOn(SchedulingRepository, "findUpcomingInstances").mockResolvedValue([mockInstance1]);
    spyOn(SchedulingRepository, "getClassInstanceAffectedUsers").mockResolvedValue(mockAffected1);
    spyOn(StudentRepository, "findById").mockResolvedValue(buildMockStudent("student-101", "Ali"));
    const dispatchSpy = spyOn(notificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([
      { channel: NotificationChannel.EMAIL, success: true },
    ]);

    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 12, locale: "ar" });

    expect(result.success).toBe(true);
    expect(SchedulingRepository.findUpcomingInstances).toHaveBeenCalledWith({ withinHours: 12 });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.arrayContaining(["teacher-201", "parent-301", "student-user-401"]),
      "ar"
    );
  });

  test("handles deleted/purged instances gracefully when getClassInstanceAffectedUsers returns null", async () => {
    spyOn(SchedulingRepository, "findUpcomingInstances").mockResolvedValue([mockInstance1, mockInstance2]);
    spyOn(SchedulingRepository, "getClassInstanceAffectedUsers").mockImplementation(async (id: string) => {
      if (id === "instance-001") return null; // deleted instance
      return mockAffected2;
    });
    spyOn(StudentRepository, "findById").mockResolvedValue(buildMockStudent("student-102", "Sarah"));
    spyOn(notificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([
      { channel: NotificationChannel.ON_APP, success: true },
    ]);

    const result = await ClassReminderService.dispatchDailyReminders();

    expect(result).toEqual({
      success: true,
      instancesProcessed: 2,
      deliveriesDispatched: 1,
    });
  });

  test("per-instance error handling: isolates individual instance failures and logs errors while batch proceeds", async () => {
    spyOn(SchedulingRepository, "findUpcomingInstances").mockResolvedValue([mockInstance1, mockInstance2]);
    spyOn(SchedulingRepository, "getClassInstanceAffectedUsers").mockImplementation(async (id: string) => {
      if (id === "instance-001") {
        throw new Error("DB connection timeout during affected user resolution");
      }
      return mockAffected2;
    });
    spyOn(StudentRepository, "findById").mockResolvedValue(buildMockStudent("student-102", "Sarah"));
    spyOn(notificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([
      { channel: NotificationChannel.EMAIL, success: true },
      { channel: NotificationChannel.ON_APP, success: true },
    ]);

    const result = await ClassReminderService.dispatchDailyReminders();

    expect(result).toEqual({
      success: true,
      instancesProcessed: 2,
      deliveriesDispatched: 2, // Only instance-002 dispatched successfully
    });

    // Check that logger.error was called for the failed instance
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "ClassReminderService: per-instance dispatch failed",
      expect.objectContaining({
        instanceId: "instance-001",
        err: expect.stringContaining("DB connection timeout"),
      })
    );
  });

  test("per-instance error handling: catches errors thrown by dispatchWithPreferences", async () => {
    spyOn(SchedulingRepository, "findUpcomingInstances").mockResolvedValue([mockInstance1, mockInstance2]);
    spyOn(SchedulingRepository, "getClassInstanceAffectedUsers").mockImplementation(async (id: string) => {
      if (id === "instance-001") return mockAffected1;
      return mockAffected2;
    });
    spyOn(StudentRepository, "findById").mockResolvedValue(buildMockStudent("student", "Test"));
    spyOn(notificationDispatchHelpers, "dispatchWithPreferences").mockImplementation(async (_payloads, userIds) => {
      if (userIds.includes("teacher-201")) {
        throw new Error("Dispatch multi failed unexpectedly");
      }
      return [{ channel: NotificationChannel.EMAIL, success: true }];
    });

    const result = await ClassReminderService.dispatchDailyReminders();

    expect(result).toEqual({
      success: true,
      instancesProcessed: 2,
      deliveriesDispatched: 1,
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "ClassReminderService: per-instance dispatch failed",
      expect.objectContaining({
        instanceId: "instance-001",
        err: expect.stringContaining("Dispatch multi failed unexpectedly"),
      })
    );
  });

  test("outer catch block: returns failure result when findUpcomingInstances throws", async () => {
    spyOn(SchedulingRepository, "findUpcomingInstances").mockRejectedValue(new Error("Database connection lost"));

    const result = await ClassReminderService.dispatchDailyReminders();

    expect(result).toEqual({
      success: false,
      instancesProcessed: 0,
      deliveriesDispatched: 0,
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "ClassReminderService.dispatchDailyReminders failed",
      expect.objectContaining({
        error: expect.stringContaining("Database connection lost"),
      })
    );
  });
});
