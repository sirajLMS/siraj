import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

const PARENT_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.ScheduleViewFamily,
  AppPermission.SessionViewDetails,
  AppPermission.SessionUpdateStatusLeave,
  AppPermission.SupportSubmitComplaint,
  AppPermission.SupportViewHistory,
  AppPermission.CommunicationSubmitSuggestion,
  AppPermission.BillingViewHistory,
  AppPermission.ParentViewStudents,
  AppPermission.ProfileCoreIdentityViewOwn,
];

describe("parent sidebar navigation", () => {
  test("shows Buruj-parity items for parent portal users", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, PARENT_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("parent-today-classes");
    expect(keys).toContain("parent-your-students");
    expect(keys).toContain("billing-parent");
    expect(keys).toContain("parent-suggest");
    expect(keys).toContain("parent-rules");
    expect(keys).toContain("complaints-submit");
    expect(keys).toContain("parent-social");
    expect(keys).toContain("logout");
    expect(keys).not.toContain("home");
    expect(keys).not.toContain("teacher-class-details");
    expect(keys).not.toContain("suggestions-submit");
  });
});
