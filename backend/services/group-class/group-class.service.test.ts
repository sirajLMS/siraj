import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type AppPermission, GroupClassAttendanceStatus } from "@/backend/enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "2b4f6d8a-1c3e-4a5b-9c7d-2e4f6a8b0c1d";
const CLASS_INSTANCE_ID = "3c5e7b9d-2d4f-4b6c-8d0e-3f5a7b9c1d2e";
const GROUP_CLASS_ID = "4d6f8a0c-3e5a-4c7d-9e1f-4a6b8c0d2e3f";
const STUDENT_ID = "5e7a9c1e-4f6b-4d8e-0a2c-5b7c9d1e3f4a";
const TEACHER_ID = "6f8b0d2f-5a7c-4e9f-1b3d-6c8d0e2f4a5b";
const SUBJECT_ID = "7a9c1e3a-6b8d-4f0a-2c4e-7d9e1f3a5b6c";

const tErrorsEn: ErrorsLabels = getServerTranslations("en").errorsTranslations;

let groupClassFixture: Record<string, unknown> | null = null;
let classInstanceFixture: Record<string, unknown> | null = null;

function buildGroupClassRow(): Record<string, unknown> {
  return {
    id: GROUP_CLASS_ID,
    classInstanceId: CLASS_INSTANCE_ID,
    courseName: "Morning Math",
    teacherName: "Sarah Ahmed",
    originalDate: new Date("2026-08-30T10:00:00.000Z"),
    rescheduledDate: null,
    timeSlot: "10:00 - 11:00",
    auditRemark: "Reviewed by admin",
    auditLoggedAt: new Date("2026-08-30T11:05:00.000Z"),
  };
}

function buildEnrollmentRows(): Record<string, unknown>[] {
  return [
    {
      id: "enrollment-1",
      groupClassId: GROUP_CLASS_ID,
      studentId: STUDENT_ID,
      studentIdNumber: "STU-001",
      attendanceStatus: "present",
      studentName: "Omar Khaled",
      studentAvatarUrl: null,
    },
  ];
}

function buildClassInstance(): Record<string, unknown> {
  return {
    id: CLASS_INSTANCE_ID,
    studentId: STUDENT_ID,
    teacherId: TEACHER_ID,
    subjectId: SUBJECT_ID,
    classType: "REGULAR",
    executionState: "COMPLETED",
    outcome: "TAKEN",
    isFrozen: false,
    adminNotes: "Follow up with the parent",
    scheduledStartAt: new Date("2026-08-30T10:00:00.000Z"),
    scheduledEndAt: new Date("2026-08-30T11:00:00.000Z"),
    updatedAt: new Date("2026-08-30T12:00:00.000Z"),
    subject: { id: SUBJECT_ID, name: "Tajwid Basics" },
    student: { id: STUDENT_ID, name: "Omar Khaled", avatarUrl: null },
    teacher: { id: TEACHER_ID, user: { id: "teacher-user-1", name: "Sarah Ahmed" } },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

const getByClassInstanceIdCalls: string[] = [];

await mock.module("@/backend/db/repo/classes/group-class.repository", () => ({
  GroupClassRepository: {
    getByClassInstanceId: mock(async (classInstanceId: string) => {
      getByClassInstanceIdCalls.push(classInstanceId);
      return groupClassFixture;
    }),
    getEnrollmentsWithStudentDetails: mock(async (_groupClassId: string) => buildEnrollmentRows()),
    getCommunications: mock(async (_groupClassId: string) => []),
  },
}));

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    getClassInstanceById: mock(async (_id: string) => classInstanceFixture),
  },
}));

await mock.module("@/backend/db/repo/notifications/notification.repository", () => ({
  NotificationRepository: {},
}));

await mock.module("@/backend/services/meeting/class-meeting-config.service", () => ({
  EffectiveMeetingService: {
    resolveForClassInstance: mock(async (_classInstanceId: string, _tErrors: ErrorsLabels) => ({
      joinUrl: "https://example.com/join/meeting-1",
      providerSlug: "zoom",
      meetingId: "meeting-1",
      logoUrl: null,
      providerName: null,
      source: "org_default",
    })),
  },
}));

await mock.module("@/backend/services/shared", () => ({
  assertHasPermission: mock(async (_userId: string, _permission: AppPermission, _message: string) => {}),
}));

const { GroupClassService } = await import("@/backend/services/group-class/group-class.service");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GroupClassService.getGroupClassAudit", () => {
  beforeEach(() => {
    getByClassInstanceIdCalls.length = 0;
    groupClassFixture = null;
    classInstanceFixture = null;
  });

  test("returns the group audit shape with isOneOnOne false when a group class row exists", async () => {
    groupClassFixture = buildGroupClassRow();
    classInstanceFixture = buildClassInstance();

    const audit = await GroupClassService.getGroupClassAudit(ACTOR_ID, CLASS_INSTANCE_ID, tErrorsEn);

    expect(getByClassInstanceIdCalls).toEqual([CLASS_INSTANCE_ID]);
    expect(audit.id).toBe(GROUP_CLASS_ID);
    expect(audit.className).toBe("Morning Math");
    expect(audit.teacherName).toBe("Sarah Ahmed");
    expect(audit.timeSlot).toBe("10:00 - 11:00");
    expect(audit.auditRemark).toBe("Reviewed by admin");
    expect(audit.isOneOnOne).toBe(false);
    expect(audit.students).toHaveLength(1);
    expect(audit.students[0]?.studentId).toBe("STU-001");
    expect(audit.students[0]?.attendanceStatus).toBe(GroupClassAttendanceStatus.PRESENT);
    expect(audit.registeredStudentCount).toBe(1);
    expect(audit.adminNote.content).toBe("Follow up with the parent");
  });

  test("builds a 1-on-1 audit from the class instance when no group class row exists", async () => {
    classInstanceFixture = buildClassInstance();

    const audit = await GroupClassService.getGroupClassAudit(ACTOR_ID, CLASS_INSTANCE_ID, tErrorsEn);

    expect(audit.isOneOnOne).toBe(true);
    expect(audit.id).toBe(CLASS_INSTANCE_ID);
    expect(audit.className).toBe("Tajwid Basics");
    expect(audit.teacherName).toBe("Sarah Ahmed");
    expect(audit.courseCode).toBe("REGULAR");
    expect(audit.timeSlot).toBe("10:00 - 11:00");
    expect(audit.auditRemark).toBeNull();
    expect(audit.auditLoggedAt).toBe("2026-08-30T12:00:00.000Z");
    expect(audit.communications).toEqual([]);
    expect(audit.adminNote).toEqual({
      content: "Follow up with the parent",
      lastUpdated: "2026-08-30T12:00:00.000Z",
    });
    expect(audit.students).toHaveLength(1);
    expect(audit.students[0]?.id).toBe(STUDENT_ID);
    expect(audit.students[0]?.name).toBe("Omar Khaled");
    expect(audit.students[0]?.initials).toBe("OK");
    expect(audit.students[0]?.attendanceStatus).toBe(GroupClassAttendanceStatus.PENDING);
    expect(audit.registeredStudentCount).toBe(1);
    expect(audit.totalStudentCount).toBe(1);
  });

  test("falls back to the class type as the audit name when the instance has no subject", async () => {
    const instance = buildClassInstance();
    instance.subject = undefined;
    classInstanceFixture = instance;

    const audit = await GroupClassService.getGroupClassAudit(ACTOR_ID, CLASS_INSTANCE_ID, tErrorsEn);

    expect(audit.isOneOnOne).toBe(true);
    expect(audit.className).toBe("REGULAR");
  });

  test("throws notFound when neither a group class nor a class instance exists", async () => {
    let thrown: unknown = null;
    try {
      await GroupClassService.getGroupClassAudit(ACTOR_ID, CLASS_INSTANCE_ID, tErrorsEn);
    } catch (error) {
      thrown = error;
    }

    if (!(thrown instanceof Error)) {
      throw new Error("Expected getGroupClassAudit to throw an Error");
    }
    expect(thrown.message).toBe(tErrorsEn.notFound);
  });
});
