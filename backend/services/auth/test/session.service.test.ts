import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { SessionRepository, TeacherRepository, UserRepository } from "@/backend/db/repo";
import { AccountStatus, type AppPermission, UserRole } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { SessionService } from "@/backend/services/auth/session.service";
import { ParentPortalService } from "@/backend/services/parent/parent-portal.service";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";
import type { SessionSelectType, UserSelectType } from "@/backend/types";

type MockUserContextOptions = {
  role: UserRole;
  isSuperAdmin?: boolean;
  permissions?: AppPermission[];
  permissionGroups?: string[];
};

type SetupTeacherProfileMocksOptions = {
  userId: string;
  nationalId: string | null;
};

const TEACHER_USER_ID = "11111111-1111-1111-1111-111111111111";
const NON_TEACHER_USER_ID = "22222222-2222-2222-2222-222222222222";

function mockSafeUser(id: string): UserSelectType {
  return {
    id,
    name: "Test User",
    email: "[EMAIL_REDACTED]",
    password: "hashed",
    rememberTokenHash: null,
    avatarUrl: null,
    avatarFilePath: null,
    phone: null,
    timezone: IanaTimezone.Africa_Cairo,
    status: AccountStatus.ACTIVATED,
    isSuperAdmin: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: null,
    displayCurrency: null,
  } as unknown as UserSelectType;
}

function mockUserContext({
  role,
  isSuperAdmin = false,
  permissions = [],
  permissionGroups = [],
}: MockUserContextOptions) {
  return { permissions, permissionGroups, isSuperAdmin, role };
}

function _setupTeacherProfileMocks({ userId, nationalId }: SetupTeacherProfileMocksOptions): void {
  spyOn(UserRepository, "findSafeById").mockResolvedValue(mockSafeUser(userId));
  spyOn(PermissionsService, "getUserContext").mockResolvedValue(mockUserContext({ role: UserRole.TEACHER }));
  spyOn(TeacherPortalService, "resolveTeacherIdForUser").mockResolvedValue("teacher-1");
  spyOn(ParentPortalService, "resolveParentIdForUser").mockResolvedValue(null);
  spyOn(TeacherRepository, "findByUserId").mockResolvedValue({
    id: "teacher-1",
    userId,
    nationalId,
  } as never);
}

function _restoreTeacherProfileMocks(): void {
  spyOn(UserRepository, "findSafeById").mockRestore();
  spyOn(PermissionsService, "getUserContext").mockRestore();
  spyOn(TeacherPortalService, "resolveTeacherIdForUser").mockRestore();
  spyOn(ParentPortalService, "resolveParentIdForUser").mockRestore();
  spyOn(TeacherRepository, "findByUserId").mockRestore();
}

afterEach(() => {
  _restoreTeacherProfileMocks();
});

describe("SessionService.getCurrentUserProfile nationalIdComplete flag", () => {
  test("returns nationalIdComplete=true for a teacher with nationalId set", async () => {
    _setupTeacherProfileMocks({ userId: TEACHER_USER_ID, nationalId: "29601234567818" });

    const profile = await SessionService.getCurrentUserProfile(TEACHER_USER_ID);
    expect(profile.nationalIdComplete).toBe(true);
  });

  test("returns nationalIdComplete=false for a teacher with nationalId null", async () => {
    _setupTeacherProfileMocks({ userId: TEACHER_USER_ID, nationalId: null });

    const profile = await SessionService.getCurrentUserProfile(TEACHER_USER_ID);
    expect(profile.nationalIdComplete).toBe(false);
  });

  test("returns nationalIdComplete=false for a teacher with whitespace-only nationalId", async () => {
    _setupTeacherProfileMocks({ userId: TEACHER_USER_ID, nationalId: "   " });

    const profile = await SessionService.getCurrentUserProfile(TEACHER_USER_ID);
    expect(profile.nationalIdComplete).toBe(false);
  });

  test("returns nationalIdComplete=true for a non-teacher user (gate is teacher-only)", async () => {
    spyOn(UserRepository, "findSafeById").mockResolvedValue(mockSafeUser(NON_TEACHER_USER_ID));
    spyOn(PermissionsService, "getUserContext").mockResolvedValue(mockUserContext({ role: UserRole.PARENT }));
    spyOn(TeacherPortalService, "resolveTeacherIdForUser").mockResolvedValue(null);
    spyOn(ParentPortalService, "resolveParentIdForUser").mockResolvedValue("parent-1");
    const teacherSpy = spyOn(TeacherRepository, "findByUserId").mockResolvedValue(null as never);

    const profile = await SessionService.getCurrentUserProfile(NON_TEACHER_USER_ID);
    expect(profile.nationalIdComplete).toBe(true);
    // TeacherRepository should not be queried for a non-teacher.
    expect(teacherSpy).not.toHaveBeenCalled();
  });
});

describe("SessionService.validateSession orphan session handling", () => {
  function _mockSession(userId: string): SessionSelectType {
    return {
      hashedId: "hashed-id",
      userId,
      ipAddress: null,
      userAgent: null,
      payload: undefined,
      lastActivity: 100n,
    } as unknown as SessionSelectType;
  }

  function _restoreSessionMocks(): void {
    spyOn(SessionRepository, "findByHmacHash").mockRestore();
    spyOn(SessionRepository, "validate").mockRestore();
    spyOn(SessionRepository, "deleteSessionById").mockRestore();
  }

  afterEach(() => {
    _restoreSessionMocks();
  });

  test("purges and returns null when session references non-existent user", async () => {
    const fakeSessionId = "fake-raw-session-id";
    const fakeUserId = "1bba9ec0-1e51-46f9-be75-9941dcb7fd76";
    const fakeSession = _mockSession(fakeUserId);

    spyOn(SessionRepository, "findByHmacHash").mockResolvedValue(fakeSession);
    spyOn(SessionRepository, "validate").mockResolvedValue(fakeSession);
    const deleteSpy = spyOn(SessionRepository, "deleteSessionById").mockResolvedValue(null);
    spyOn(UserRepository, "findSafeById").mockResolvedValue(null);

    const result = await SessionService.validateSession(fakeSessionId);

    expect(result).toBeNull();
    expect(deleteSpy).toHaveBeenCalledWith(fakeSessionId);
  });
});
