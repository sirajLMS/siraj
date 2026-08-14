import { beforeEach, describe, expect, mock, test } from "bun:test";
import { AppPermission, NotificationEventType, StudentStatus } from "@/backend/enum";
import { errorsEn } from "@/shared/locale/en/errors";

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

const ACTOR_ID = "actor-uuid-0001";
const STUDENT_ID = "student-uuid-0001";
const PARENT_ID = "parent-uuid-0001";
const PARENT_USER_ID = "parent-user-uuid-0001";
const OLD_TEACHER_ID = "old-teacher-uuid-0001";
const OLD_TEACHER_USER_ID = "old-teacher-user-0001";
const NEW_TEACHER_ID = "new-teacher-uuid-0001";
const NEW_TEACHER_USER_ID = "new-teacher-user-0001";

const mockStudentRow = {
  id: STUDENT_ID,
  parentId: PARENT_ID,
  primaryTeacherId: OLD_TEACHER_ID,
  name: "Test Student",
  status: StudentStatus.REGULAR,
  classesRemaining: 5,
  classesTotal: 10,
  version: 1,
  userId: "student-user-id",
};

const mockUpdatedStudentRow = {
  ...mockStudentRow,
  version: 2,
};

const mockSuspendedStudentRow = {
  ...mockStudentRow,
  version: 2,
  status: StudentStatus.SUSPENDED,
};

// --- Repo mocks ----------------------------------------------------------

const findByIdMock = mock(async () => mockStudentRow);
const reassignTeacherMock = mock(async () => mockUpdatedStudentRow);
const changeStatusMock = mock(async () => mockSuspendedStudentRow);
const teacherFindByIdMock = mock(async (id: string) => {
  if (id === NEW_TEACHER_ID) return { id: NEW_TEACHER_ID, userId: NEW_TEACHER_USER_ID };
  if (id === OLD_TEACHER_ID) return { id: OLD_TEACHER_ID, userId: OLD_TEACHER_USER_ID };
  return null;
});
const parentFindUserIdByParentIdMock = mock(async () => PARENT_USER_ID);
const userFindByIdMock = mock(async (id: string) => {
  if (id === PARENT_USER_ID) return { id, name: "Test Parent" };
  if (id === NEW_TEACHER_USER_ID) return { id, name: "New Teacher" };
  if (id === OLD_TEACHER_USER_ID) return { id, name: "Old Teacher" };
  return null;
});

await mock.module("@/backend/db/repo", () => ({
  StudentRepository: {
    findById: findByIdMock,
    reassignTeacher: reassignTeacherMock,
    changeStatus: changeStatusMock,
  },
  TeacherRepository: {
    findById: teacherFindByIdMock,
  },
  ParentRepository: {
    findUserIdByParentId: parentFindUserIdByParentIdMock,
  },
  UserRepository: {
    findById: userFindByIdMock,
  },
}));

await mock.module("@/backend/db/repo/students", () => ({
  StudentRepository: {
    findById: findByIdMock,
    reassignTeacher: reassignTeacherMock,
    changeStatus: changeStatusMock,
  },
}));

await mock.module("@/backend/db/repo/teachers", () => ({
  TeacherRepository: {
    findById: teacherFindByIdMock,
  },
}));

await mock.module("@/backend/db/repo/parents", () => ({
  ParentRepository: {
    findUserIdByParentId: parentFindUserIdByParentIdMock,
  },
}));

await mock.module("@/backend/db/repo/users", () => ({
  UserRepository: {
    findById: userFindByIdMock,
  },
}));

// --- Permissions mock ----------------------------------------------------

const hasPermissionMock = mock(async () => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// --- Field ACL mock ------------------------------------------------------

await mock.module("@/backend/services/student/student-field-acl", () => ({
  buildStudentFieldFilterContext: async () => ({}),
  assertStudentFieldEdit: () => undefined,
}));

// --- Notification builder + dispatch mocks ------------------------------

const buildStudentLifecyclePayloadsMock = mock(
  (
    _studentId: string,
    _eventType: NotificationEventType,
    _affectedUserIds: string[],
    _locale: string | undefined,
    _metadata: Record<string, string>
  ): unknown[] => [{ channel: "on_app" }]
);

await mock.module("@/backend/services/notification/notification-payloads.builders", () => ({
  CHANNEL_FROM_ENUM: {},
  ALL_CHANNELS: [],
  NOTIFICATION_TEMPLATE_MAP: {},
  buildPerChannel: () => [],
  fanOutToUsers: () => [],
  buildInvoiceGeneratedPayloads: () => [],
  buildInvoiceStatusChangedPayloads: () => [],
  buildPaymentMethodChangedPayloads: () => [],
  buildClassLifecyclePayloads: () => [],
  buildStudentLifecyclePayloads: buildStudentLifecyclePayloadsMock,
  buildLessonReportSubmittedPayloads: () => [],
  buildLessonReportReviewedPayloads: () => [],
  buildNewComplaintPayloads: () => [],
}));

const dispatchWithPreferencesMock = mock(
  async (_payloads: unknown, _affectedUserIds: string[], _locale?: string): Promise<unknown[]> => []
);

await mock.module("@/backend/services/notification/notification-dispatch.helpers", () => ({
  dispatchWithPreferences: dispatchWithPreferencesMock,
}));

// --- Logger mock (the service imports `logger` from `@/backend/lib/logger`) --

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    log: () => {},
  },
  default: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    log: () => {},
  },
}));

// --- Locale mock ---------------------------------------------------------

await mock.module("@/shared/locale", () => ({
  getServerTranslations: () => ({
    errorsTranslations: new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (typeof prop === "string") return () => prop;
          return undefined;
        },
      }
    ),
  }),
}));

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first)
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/student/student-lifecycle.service")> {
  return import("@/backend/services/student/student-lifecycle.service");
}

function resetMocks(): void {
  findByIdMock.mockReset();
  findByIdMock.mockResolvedValue(mockStudentRow);
  reassignTeacherMock.mockReset();
  reassignTeacherMock.mockResolvedValue(mockUpdatedStudentRow);
  changeStatusMock.mockReset();
  changeStatusMock.mockResolvedValue(mockSuspendedStudentRow);
  teacherFindByIdMock.mockReset();
  teacherFindByIdMock.mockImplementation(async (id: string) => {
    if (id === NEW_TEACHER_ID) return { id: NEW_TEACHER_ID, userId: NEW_TEACHER_USER_ID };
    if (id === OLD_TEACHER_ID) return { id: OLD_TEACHER_ID, userId: OLD_TEACHER_USER_ID };
    return null;
  });
  parentFindUserIdByParentIdMock.mockReset();
  parentFindUserIdByParentIdMock.mockResolvedValue(PARENT_USER_ID);
  userFindByIdMock.mockReset();
  userFindByIdMock.mockImplementation(async (id: string) => {
    if (id === PARENT_USER_ID) return { id, name: "Test Parent" };
    if (id === NEW_TEACHER_USER_ID) return { id, name: "New Teacher" };
    if (id === OLD_TEACHER_USER_ID) return { id, name: "Old Teacher" };
    return null;
  });
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);
  buildStudentLifecyclePayloadsMock.mockReset();
  buildStudentLifecyclePayloadsMock.mockReturnValue([{ channel: "on_app" }]);
  dispatchWithPreferencesMock.mockReset();
  dispatchWithPreferencesMock.mockResolvedValue([]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StudentLifecycleService — notification dispatch", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("reassignTeacher", () => {
    test("dispatches payloads to parent + old + new teacher via dispatchWithPreferences", async () => {
      const { StudentLifecycleService } = await importService();

      await StudentLifecycleService.reassignTeacher(ACTOR_ID, STUDENT_ID, NEW_TEACHER_ID, errorsEn, undefined, "en");

      expect(hasPermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.STUDENT_REASSIGN_TEACHER);
      expect(reassignTeacherMock).toHaveBeenCalledTimes(1);

      // Builder is invoked once per recipient (parent / oldTeacher / newTeacher) → 3 calls.
      expect(buildStudentLifecyclePayloadsMock).toHaveBeenCalledTimes(3);

      // dispatchWithPreferences is called once with the aggregated fan-out set.
      expect(dispatchWithPreferencesMock).toHaveBeenCalledTimes(1);

      const dispatchCalls = dispatchWithPreferencesMock.mock.calls;
      const affectedUserIds = dispatchCalls[0]?.[1] ?? [];
      expect(affectedUserIds).toContain(PARENT_USER_ID);
      expect(affectedUserIds).toContain(OLD_TEACHER_USER_ID);
      expect(affectedUserIds).toContain(NEW_TEACHER_USER_ID);
      expect(affectedUserIds).toHaveLength(3);

      const builderCalls = buildStudentLifecyclePayloadsMock.mock.calls;
      const recipients = builderCalls.map(c => c[4].recipient);
      expect(recipients).toContain("parent");
      expect(recipients).toContain("oldTeacher");
      expect(recipients).toContain("newTeacher");
    });

    test("still resolves the reassignment when notification dispatch throws", async () => {
      const { StudentLifecycleService } = await importService();
      dispatchWithPreferencesMock.mockRejectedValueOnce(new Error("notification downstream failure"));

      // The action must NOT throw — dispatch failures are swallowed.
      const result = await StudentLifecycleService.reassignTeacher(
        ACTOR_ID,
        STUDENT_ID,
        NEW_TEACHER_ID,
        errorsEn,
        undefined,
        "en"
      );

      expect(result.id).toBe(STUDENT_ID);
      expect(reassignTeacherMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("changeStudentStatus", () => {
    test("dispatches a single payload set to the parent with STUDENT_STATUS_CHANGED", async () => {
      const { StudentLifecycleService } = await importService();

      await StudentLifecycleService.changeStudentStatus(
        ACTOR_ID,
        STUDENT_ID,
        StudentStatus.SUSPENDED,
        errorsEn,
        undefined,
        "en"
      );

      expect(changeStatusMock).toHaveBeenCalledTimes(1);

      // Single recipient (parent) → 1 builder call.
      expect(buildStudentLifecyclePayloadsMock).toHaveBeenCalledTimes(1);

      const builderCalls = buildStudentLifecyclePayloadsMock.mock.calls;
      const builderCall = builderCalls[0];
      expect(builderCall?.[0]).toBe(STUDENT_ID);
      expect(builderCall?.[1]).toBe(NotificationEventType.STUDENT_STATUS_CHANGED);
      expect(builderCall?.[2]).toEqual([PARENT_USER_ID]);
      expect(builderCall?.[3]).toBe("en");
      const metadata = builderCall?.[4];
      expect(metadata.studentName).toBe("Test Student");
      expect(metadata.oldStatus).toBe(StudentStatus.REGULAR);
      expect(metadata.newStatus).toBe(StudentStatus.SUSPENDED);

      expect(dispatchWithPreferencesMock).toHaveBeenCalledTimes(1);
      const dispatchCalls = dispatchWithPreferencesMock.mock.calls;
      expect(dispatchCalls[0]?.[1]).toEqual([PARENT_USER_ID]);
    });
  });
});
