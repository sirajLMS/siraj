import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { getVisibleUsersDirectoryTabs } from "@/frontend/common/views/dashboard/users/directory/tabs/config/usersDirectoryTabs.config";

const STAFF_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.DashboardViewMetrics,
  AppPermission.ScheduleViewAll,
  AppPermission.SessionViewDetails,
  AppPermission.TeachersList,
  AppPermission.ParentsList,
  AppPermission.StudentsList,
  AppPermission.ComplaintsList,
];

describe("getVisibleUsersDirectoryTabs", () => {
  test("staff with list permissions sees teachers, parents, and students tabs", () => {
    const permissionSet = new Set(STAFF_PERMISSIONS);
    const tabs = getVisibleUsersDirectoryTabs(permission => permissionSet.has(permission));
    const tabIds = tabs.map(tab => tab.id);

    expect(tabIds).toContain("teachers");
    expect(tabIds).toContain("parents");
    expect(tabIds).toContain("students");
    expect(tabIds).not.toContain("staff");
  });
});
