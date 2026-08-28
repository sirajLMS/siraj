import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

const STAFF_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.DashboardViewMetrics,
  AppPermission.DashboardMetricsViewAll,
  AppPermission.ScheduleViewAll,
  AppPermission.SessionViewDetails,
  AppPermission.TeachersList,
  AppPermission.ParentsList,
  AppPermission.StudentsList,
  AppPermission.ComplaintsList,
];

describe("staff sidebar navigation", () => {
  test("does not show admin classes nav that redirects non-teachers to /dashboard", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, STAFF_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("home");
    expect(keys).not.toContain("classes");
    expect(keys).not.toContain("teacher-class-details");
  });
});
