import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { getNavItemsForPermissions, SIDEBAR_NAV_ITEMS } from "@/frontend/views/dashboard/config/navigationConfig";

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

describe("teacher sidebar navigation", () => {
  test("shows Buruj-parity items for teacher portal users", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, TEACHER_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("today-classes");
    expect(keys).toContain("regular-schedule");
    expect(keys).toContain("your-students");
    expect(keys).toContain("resources");
    expect(keys).toContain("teacher-salary");
    expect(keys).toContain("teacher-class-details");
    expect(keys).toContain("teacher-rules");
    expect(keys).toContain("logout");
    expect(keys).not.toContain("home");
    expect(keys).not.toContain("books-and-bags");
  });
});
