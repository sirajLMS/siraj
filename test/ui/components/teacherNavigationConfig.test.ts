import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

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
  AppPermission.ProfileCoreIdentityViewOwn,
];

describe("teacher sidebar navigation", () => {
  test("shows Buruj-parity items for teacher portal users", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, TEACHER_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("today-classes");
    expect(keys).toContain("regular-schedule");
    expect(keys).toContain("your-students");
    expect(keys).toContain("teacher-class-details");
    expect(keys).toContain("teacher-rules");
    expect(keys).toContain("resources");
    expect(keys).not.toContain("classes");
    expect(keys).not.toContain("teacher-profile");
    expect(keys).not.toContain("logout");
    expect(keys).not.toContain("home");
    expect(keys).not.toContain("books-and-bags");

    const classListItem = items.find(item => item.key === "teacher-class-details");
    expect(classListItem?.href).toBe("/classes");
    expect(classListItem?.labelKey).toBe("teacherClassList");
  });

  test("keeps classes nav when teacher-class-details is unavailable", () => {
    const permissions: AppPermission[] = [
      AppPermission.DashboardView,
      AppPermission.TeacherViewDashboard,
      AppPermission.ScheduleManageRecurring,
      AppPermission.ProfileCoreIdentityViewOwn,
    ];
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions);
    const keys = items.map(item => item.key);

    expect(keys).toContain("classes");
    expect(keys).not.toContain("teacher-class-details");
    expect(keys).not.toContain("home");
  });
});
