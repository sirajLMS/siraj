import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { ParentRepository } from "@/backend/db/repo/parents";
import { StudentRepository } from "@/backend/db/repo/students";
import { StudentHistoryRepository } from "@/backend/db/repo/students/student-history.repository";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { EffectiveMeetingSource, UserRole } from "@/backend/enum";
import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StudentHistoryService } from "@/backend/services/history/student-history.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type { EffectiveMeetingReturnType, SessionSummary, StudentSelectType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { errorsEn } from "@/shared/locale/en/errors";

const tErrors = errorsEn;

function createMockStudent(overrides: Partial<StudentSelectType> = {}): StudentSelectType {
  return {
    id: "student-1",
    parentId: null,
    userId: "user-1",
    primaryTeacherId: null,
    name: "Alice",
    avatarUrl: null,
    dateOfBirth: null,
    gender: null,
    language: null,
    timezoneOverride: null,
    status: StudentStatus.REGULAR,
    classesTotal: 0,
    classesRemaining: 0,
    creditHoursTotal: "0.00",
    creditHoursRemaining: "0.00",
    version: 0,
    hoursPerWeek: "0",
    idempotencyKey: "key-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

afterEach(() => {
  spyOn(PermissionsService, "getUserContext").mockRestore();
  spyOn(PermissionsService, "hasPermission").mockRestore();
  spyOn(StudentRepository, "findProfileById").mockRestore();
  spyOn(StudentRepository, "findById").mockRestore();
  spyOn(ParentRepository, "findByUserId").mockRestore();
  spyOn(TeacherRepository, "findByUserId").mockRestore();
  spyOn(StudentHistoryRepository, "getMonthlyMetrics").mockRestore();
  spyOn(StudentHistoryRepository, "getMonthlyCalendar").mockRestore();
  spyOn(StudentHistoryRepository, "getSessionDetail").mockRestore();
  spyOn(EffectiveMeetingService, "resolveForClassInstance").mockRestore();
  spyOn(EffectiveMeetingService, "resolveForClassInstances").mockRestore();
});

const MOCK_RAW_SESSIONS: SessionSummary[] = [
  {
    id: "session-1",
    title: "Math",
    dayOfMonth: 10,
    time: "2026-06-10T10:00:00Z",
    duration: 60,
    instructor: "Teacher 1",
    teacherId: "teacher-1",
    timeSlot: "10:00 - 11:00",
    room: "Zoom 1",
    status: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.TAKEN,
    isFrozen: false,
    notes: "",
  },
  {
    id: "session-2",
    title: "Math",
    dayOfMonth: 12,
    time: "2026-06-12T10:00:00Z",
    duration: 60,
    instructor: "Teacher 1",
    teacherId: "teacher-1",
    timeSlot: "10:00 - 11:00",
    room: "Zoom 2",
    status: ClassExecutionState.NOT_ACTIVATED,
    outcome: null,
    isFrozen: false,
    notes: "",
  },
];

const MOCK_EFFECTIVE_MEETING_1: EffectiveMeetingReturnType = {
  joinUrl: "https://zoom.us/j/111",
  providerSlug: "zoom",
  providerName: { en: "Zoom" },
  logoUrl: null,
  meetingId: "111",
  source: EffectiveMeetingSource.CLASS,
  configId: "cfg-1",
  providerId: "prov-1",
  supportsAutoGeneration: false,
};

const MOCK_EFFECTIVE_MEETING_2: EffectiveMeetingReturnType = {
  joinUrl: "https://zoom.us/j/222",
  providerSlug: "zoom",
  providerName: { en: "Zoom" },
  logoUrl: null,
  meetingId: "222",
  source: EffectiveMeetingSource.TEACHER,
  configId: "cfg-2",
  providerId: "prov-1",
  supportsAutoGeneration: false,
};

describe("StudentHistoryService.getStudentClassHistory", () => {
  test("fetches metrics, raw sessions, and batch resolves effective meeting links", async () => {
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [],
      permissionGroups: [],
      isSuperAdmin: true,
      role: UserRole.SUPER_ADMIN,
    });

    spyOn(StudentHistoryRepository, "getMonthlyMetrics").mockResolvedValue({
      totalClasses: 2,
      attendanceRate: 100,
      hoursStudied: 2,
      performance: 90,
    });

    spyOn(StudentHistoryRepository, "getMonthlyCalendar").mockResolvedValue(MOCK_RAW_SESSIONS);
    spyOn(StudentRepository, "findById").mockResolvedValue(createMockStudent());

    let singleResolveCallsCount = 0;
    const resolveSingle = async (id: string): Promise<EffectiveMeetingReturnType> => {
      singleResolveCallsCount++;
      return id === "session-1" ? MOCK_EFFECTIVE_MEETING_1 : MOCK_EFFECTIVE_MEETING_2;
    };
    spyOn(EffectiveMeetingService, "resolveForClassInstance").mockImplementation(resolveSingle);

    let batchResolveCallsCount = 0;
    spyOn(EffectiveMeetingService, "resolveForClassInstances").mockImplementation(async ids => {
      batchResolveCallsCount++;
      const map = new Map();
      if (ids.includes("session-1")) map.set("session-1", MOCK_EFFECTIVE_MEETING_1);
      if (ids.includes("session-2")) map.set("session-2", MOCK_EFFECTIVE_MEETING_2);
      return map;
    });

    const result = await StudentHistoryService.getStudentClassHistory("admin-1", "student-1", 2026, 6, tErrors);

    expect(result.id).toBe("history-student-1-2026-6");
    expect(result.studentName).toBe("Alice");
    expect(result.metrics.totalClasses).toBe(2);
    expect(result.sessions).toHaveLength(2);

    expect(result.sessions[0].meetingJoinUrl).toBe("https://zoom.us/j/111");
    expect(result.sessions[0].status).toBe(ClassExecutionState.COMPLETED);
    expect(result.sessions[0].outcome).toBe(ClassOutcome.TAKEN);

    expect(result.sessions[1].meetingJoinUrl).toBe("https://zoom.us/j/222");
    expect(result.sessions[1].status).toBe(ClassExecutionState.NOT_ACTIVATED);
    expect(result.sessions[1].outcome).toBeNull();

    // Verify N+1 is eliminated: 1 batch call, 0 single calls
    expect(batchResolveCallsCount).toBe(1);
    expect(singleResolveCallsCount).toBe(0);
  });
});
