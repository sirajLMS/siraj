import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";
import { getActiveNavKey } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";

const TEACHER_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.TeacherViewDashboard,
  AppPermission.ScheduleViewAssigned,
  AppPermission.ScheduleViewWeekly,
  AppPermission.ScheduleViewWorkload,
  AppPermission.SessionViewDetails,
  AppPermission.SessionActivateClass,
  AppPermission.SessionUpdateStatusStart,
  AppPermission.SessionUpdateStatusAbsent,
  AppPermission.SessionUpdateStatusLeave,
  AppPermission.ResourcesList,
  AppPermission.TeacherViewStudents,
  AppPermission.TeacherViewOwnProfile,
];

const ADMIN_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.DashboardViewMetrics,
  AppPermission.StaffViewDirectory,
  AppPermission.StudentsList,
];

describe("getActiveNavKey", () => {
  test("highlights today-classes for teacher on /dashboard", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, TEACHER_PERMISSIONS);
    expect(getActiveNavKey("/dashboard", items)).toBe("today-classes");
  });

  test("highlights your-students on /students", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, TEACHER_PERMISSIONS);
    expect(getActiveNavKey("/students", items)).toBe("your-students");
  });

  test("highlights regular-schedule on /teachers/me/schedule/weekly", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, TEACHER_PERMISSIONS);
    expect(getActiveNavKey("/teachers/me/schedule/weekly", items)).toBe("regular-schedule");
  });

  test("highlights regular-schedule on /teachers/me/schedule/weekly/extra", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, TEACHER_PERMISSIONS);
    expect(getActiveNavKey("/teachers/me/schedule/weekly/extra", items)).toBe("regular-schedule");
  });

  test("prefers longest matching href when multiple items match", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, [...ADMIN_PERMISSIONS, ...TEACHER_PERMISSIONS]);
    expect(getActiveNavKey("/teachers", items)).toBe("teachers");
  });

  test("highlights teachers on /teachers for admin", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ADMIN_PERMISSIONS);
    expect(getActiveNavKey("/teachers", items)).toBe("teachers");
  });

  test("strips locale prefix before matching", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, TEACHER_PERMISSIONS);
    expect(getActiveNavKey("/ar/students", items)).toBe("your-students");
  });

  test("returns null (not 'home') for orphan routes with no matching nav item", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ADMIN_PERMISSIONS);
    expect(getActiveNavKey("/this-route-does-not-exist-anywhere", items)).toBeNull();
  });

  test("returns null when no items match a deep dynamic segment without a parent nav item", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ADMIN_PERMISSIONS);
    expect(getActiveNavKey("/some/orphan/route", items)).toBeNull();
  });
});
