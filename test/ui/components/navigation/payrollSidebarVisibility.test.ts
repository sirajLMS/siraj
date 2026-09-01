import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

const BASE_PERMISSIONS: AppPermission[] = [AppPermission.AuthLogin, AppPermission.DashboardViewMetrics];

function visibleNavKeys(permissions: AppPermission[]): string[] {
  return getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions).map(item => item.key);
}

describe("payroll sidebar navigation gating", () => {
  test("payroll item is visible to holders of the accounting payroll view permission", () => {
    const keys = visibleNavKeys([...BASE_PERMISSIONS, AppPermission.AccountingPayrollView]);
    expect(keys).toContain("accounting-payroll");
  });

  test("payroll item wiring points at the payroll route and the finance group", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, [
      ...BASE_PERMISSIONS,
      AppPermission.AccountingPayrollView,
    ]);
    const payrollItem = items.find(item => item.key === "accounting-payroll");
    expect(payrollItem?.href).toBe("/accounting/payroll");
    expect(payrollItem?.groupId).toBe("grp_finance");
    expect(payrollItem?.labelKey).toBe("accountingPayroll");
  });

  test("payroll item stays hidden for manage-only actors because the page guard requires view", () => {
    const keys = visibleNavKeys([...BASE_PERMISSIONS, AppPermission.AccountingPayrollManage]);
    expect(keys).not.toContain("accounting-payroll");
  });

  test("payroll item stays hidden for actors without payroll permissions", () => {
    expect(visibleNavKeys(BASE_PERMISSIONS)).not.toContain("accounting-payroll");
  });

  test("payroll page permission entry pins the view-only gate shared by nav and route", () => {
    expect(PAGE_PERMISSIONS.accountingPayrollView).toEqual([AppPermission.AccountingPayrollView]);
  });
});
