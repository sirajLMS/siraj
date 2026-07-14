import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

const SUPERVISOR_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.SupervisorViewDashboard,
  AppPermission.LessonReportsReview,
  AppPermission.LessonReportsApprove,
  AppPermission.LessonReportsReject,
  AppPermission.TeacherDuesView,
  AppPermission.MonthlyReportsView,
  AppPermission.AuthViewOwnProfile,
];

describe("supervisor sidebar navigation", () => {
  test("shows supervisor portal items for supervisor users", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, SUPERVISOR_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("supervisor-home");
    expect(keys).toContain("pending-reviews");
    expect(keys).toContain("teacher-dues");
    expect(keys).toContain("monthly-reports");
    expect(keys).toContain("supervisor-profile");
    expect(keys).toContain("logout");

    expect(keys).not.toContain("home");
    expect(keys).not.toContain("own-profile");
    expect(keys).not.toContain("search-schedule");
    expect(keys).not.toContain("schedule-tracking");
    expect(keys).not.toContain("status-tracking");

    expect(keys).not.toContain("today-classes");
    expect(keys).not.toContain("regular-schedule");
    expect(keys).not.toContain("your-students");
    expect(keys).not.toContain("teacher-rules");

    expect(keys).not.toContain("parent-today-classes");
    expect(keys).not.toContain("parent-your-students");
    expect(keys).not.toContain("billing-parent");
    expect(keys).not.toContain("student-today-classes");
    expect(keys).not.toContain("student-credits");
  });
});
