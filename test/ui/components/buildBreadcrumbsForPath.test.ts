import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";
import {
  buildBreadcrumbsForPath,
  itemPermissionAllowsItem,
} from "@/frontend/common/views/dashboard/lib/buildBreadcrumbsForPath";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

const ADMIN_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.DashboardViewMetrics,
  AppPermission.StaffViewDirectory,
  AppPermission.StudentsList,
  AppPermission.TeachersList,
  AppPermission.BillingViewHistory,
  AppPermission.BillingViewExchangeRates,
  AppPermission.BillingManageCurrencyHedges,
  AppPermission.BillingCreateInvoice,
];

const resolveLabel = (labelKey: NavItem["labelKey"]): string => `label:${labelKey}`;

const hasAdminPermission = (permission: AppPermission): boolean => ADMIN_PERMISSIONS.includes(permission);

describe("buildBreadcrumbsForPath", () => {
  test("emits parent nav crumb for /billing with tab current title", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ADMIN_PERMISSIONS);
    const crumbs = buildBreadcrumbsForPath(
      "/billing",
      items,
      hasAdminPermission,
      resolveLabel,
      "label:billingTabs.overview"
    );

    expect(crumbs).toEqual([
      { label: "label:billingAdmin", href: "/billing" },
      { label: "label:billingTabs.overview", current: true },
    ]);
  });

  test("strips locale prefix before walking nav items", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ADMIN_PERMISSIONS);
    const crumbs = buildBreadcrumbsForPath("/ar/teachers", items, hasAdminPermission, resolveLabel);

    expect(crumbs).toEqual([{ label: "label:teachers", href: "/teachers" }]);
  });

  test("filters crumbs for items the user cannot access", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, [AppPermission.DashboardView]);
    const crumbs = buildBreadcrumbsForPath("/billing", items, () => false, resolveLabel, "Invoices");

    expect(crumbs).toEqual([{ label: "Invoices", current: true }]);
  });

  test("appends override crumbs before the current title", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ADMIN_PERMISSIONS);
    const crumbs = buildBreadcrumbsForPath("/teachers", items, hasAdminPermission, resolveLabel, "Teacher Name", [
      { label: "Custom segment", href: "/teachers/123" },
    ]);

    expect(crumbs).toEqual([
      { label: "label:teachers", href: "/teachers" },
      { label: "Custom segment", href: "/teachers/123" },
      { label: "Teacher Name", current: true },
    ]);
  });

  test("normalizes root path to /dashboard", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ADMIN_PERMISSIONS);
    const crumbs = buildBreadcrumbsForPath("/", items, hasAdminPermission, resolveLabel);

    expect(crumbs.some(crumb => crumb.href === "/dashboard")).toBe(true);
  });
});

describe("itemPermissionAllowsItem", () => {
  test("returns true when item has no permission gate", () => {
    expect(itemPermissionAllowsItem({ permission: undefined }, () => false)).toBe(true);
  });

  test("uses OR semantics for permission arrays", () => {
    const item = {
      permission: [AppPermission.BillingViewHistory, AppPermission.BillingCreateInvoice] as const,
    };
    expect(itemPermissionAllowsItem(item, p => p === AppPermission.BillingCreateInvoice)).toBe(true);
    expect(itemPermissionAllowsItem(item, () => false)).toBe(false);
  });
});
