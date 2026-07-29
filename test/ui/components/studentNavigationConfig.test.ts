import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

const STUDENT_PERMISSIONS: AppPermission[] = [
  AppPermission.StudentViewOwnDashboard,
  AppPermission.ProfileCoreIdentityViewOwn,
  AppPermission.ScheduleViewAssigned,
  AppPermission.SessionViewDetails,
  AppPermission.HistoryViewCalendar,
  AppPermission.HistoryViewDetails,
];

describe("student sidebar navigation", () => {
  test("shows student portal items for student users", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, STUDENT_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("student-today-classes");
    expect(keys).toContain("student-schedule");
    expect(keys).toContain("student-credits");
    expect(keys).toContain("student-profile");
    expect(keys).toContain("logout");

    const profile = items.find(item => item.key === "student-profile");
    expect(profile?.href).toBe("/profile");

    expect(keys).not.toContain("home");
    expect(keys).not.toContain("search-schedule");
    expect(keys).not.toContain("schedule-tracking");
    expect(keys).not.toContain("status-tracking");
    expect(keys).not.toContain("schedule-alerts");
    expect(keys).not.toContain("own-profile");

    expect(keys).not.toContain("today-classes");
    expect(keys).not.toContain("your-students");
    expect(keys).not.toContain("parent-your-students");
    expect(keys).not.toContain("parent-suggest");
    expect(keys).not.toContain("billing-parent");
    expect(keys).not.toContain("resources");
    expect(keys).not.toContain("books-and-bags");
  });
});
