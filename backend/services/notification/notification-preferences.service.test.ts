import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { AppPermission, NotificationChannel, NotificationEventType, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { NotificationPreferencesService } from "@/backend/services/notification/notification-preferences.service";
import {
  type NotificationPreferenceRole,
  resolveNotificationEventAllowlist,
  STUDENT_NOTIFICATION_EVENTS,
  SUPERVISOR_NOTIFICATION_EVENTS,
} from "@/shared/constants/notification-event-allowlists";

afterEach(() => {
  spyOn(PermissionsService, "hasAnyPermission").mockRestore();
  spyOn(PermissionsService, "getUserContext").mockRestore();
  spyOn(NotificationPreferencesRepository, "getByUserId").mockRestore();
});

/** Mirrors NotificationPreferencesService role → allowlist resolution. */
function resolvePreferenceRole(userRole: UserRole): NotificationPreferenceRole {
  switch (userRole) {
    case UserRole.STUDENT:
      return "student";
    case UserRole.SUPERVISOR:
      return "supervisor";
    case UserRole.PARENT:
      return "parent";
    case UserRole.TEACHER:
      return "teacher";
    case UserRole.STAFF:
      return "staff";
    case UserRole.SUPER_ADMIN:
    case UserRole.ACADEMY_ADMIN:
      return "admin";
    default:
      return "staff";
  }
}

function eventTypesForRole(role: NotificationPreferenceRole): NotificationEventType[] {
  const allowlist = resolveNotificationEventAllowlist(role);
  if (allowlist === "ALL") {
    return Object.values(NotificationEventType);
  }
  const allowed = new Set<string>(allowlist);
  return Object.values(NotificationEventType).filter(eventType => allowed.has(eventType));
}

describe("NotificationPreferencesService role allowlists", () => {
  test("staff/parent/teacher/admin materialize the full event × channel matrix", () => {
    const channelCount = Object.values(NotificationChannel).length;
    const eventCount = Object.values(NotificationEventType).length;

    for (const role of ["staff", "parent", "teacher", "admin"] as const) {
      expect(eventTypesForRole(role)).toHaveLength(eventCount);
      expect(eventTypesForRole(role).length * channelCount).toBe(channelCount * eventCount);
    }
  });

  test("student only materializes CLASS_* + CLASS_REMINDER events", () => {
    const events = eventTypesForRole(resolvePreferenceRole(UserRole.STUDENT));
    expect(new Set(events as string[])).toEqual(new Set(STUDENT_NOTIFICATION_EVENTS as readonly string[]));
  });

  test("supervisor only materializes lesson-report + complaint events", () => {
    const events = eventTypesForRole(resolvePreferenceRole(UserRole.SUPERVISOR));
    expect(new Set(events as string[])).toEqual(new Set(SUPERVISOR_NOTIFICATION_EVENTS as readonly string[]));
  });
});

describe("NotificationPreferencesService.getPreferences access", () => {
  test("allows students with student.student_identity.view_own", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      const list = keys as AppPermission[];
      return list.includes(AppPermission.STUDENT_IDENTITY_VIEW_OWN);
    });
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [AppPermission.STUDENT_IDENTITY_VIEW_OWN],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.STUDENT,
    });
    spyOn(NotificationPreferencesRepository, "getByUserId").mockResolvedValue([]);

    const preferences = await NotificationPreferencesService.getPreferences("student-user");

    expect(preferences.length).toBeGreaterThan(0);
    expect(PermissionsService.hasAnyPermission).toHaveBeenCalledWith("student-user", [
      AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
      AppPermission.STUDENT_IDENTITY_VIEW_OWN,
    ]);
  });

  test("rejects users without profile or student own-view permissions", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(false);

    await expect(NotificationPreferencesService.getPreferences("restricted-user")).rejects.toThrow();
  });
});
