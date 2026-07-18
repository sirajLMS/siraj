import { describe, expect, test } from "bun:test";
import { NotificationChannel, NotificationEventType, UserRole } from "@/backend/enum";
import {
  type NotificationPreferenceRole,
  resolveNotificationEventAllowlist,
  STUDENT_NOTIFICATION_EVENTS,
  SUPERVISOR_NOTIFICATION_EVENTS,
} from "@/shared/constants/notification-event-allowlists";

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
