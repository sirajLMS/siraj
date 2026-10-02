import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { makeNavItem } from "@/frontend/common/views/dashboard/config/navigationItems.factory";

import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Finance / accounting sidebar entries grouped under `grp_finance`,
 * `grp_accounting` and `grp_reports`.
 */
export const SIDEBAR_FINANCE_NAV_ITEMS: readonly NavItem[] = [
  makeNavItem("reports", "reports", "assessment", "/reports", PAGE_PERMISSIONS.reports, { groupId: "grp_reports" }),
  makeNavItem(
    "accounting-reports",
    "accountingReports",
    "assessment",
    "/accounting/reports",
    PAGE_PERMISSIONS.accountingReportsView,
    { groupId: "grp_reports" }
  ),
  makeNavItem("billing-admin", "billingAdmin", "payments", "/billing", PAGE_PERMISSIONS.billingAdmin, {
    groupId: "grp_finance",
  }),
  makeNavItem("quotas", "quotas", "accountBalanceWallet", "/quotas", PAGE_PERMISSIONS.quotas, {
    groupId: "grp_finance",
  }),
  makeNavItem("quotas-create", "quotasCreate", "accountBalanceWallet", "/quotas/new", PAGE_PERMISSIONS.quotasCreate, {
    groupId: "grp_finance",
  }),
  makeNavItem(
    "payment-catalogs",
    "paymentCatalogs",
    "accountBalanceWallet",
    "/payment-catalogs",
    PAGE_PERMISSIONS.paymentCatalogsParent,
    { groupId: "grp_finance" }
  ),
  makeNavItem(
    "accounting-credits",
    "accountingCredits",
    "accountBalanceWallet",
    "/accounting/credits",
    PAGE_PERMISSIONS.accountingCreditsManage,
    { groupId: "grp_finance" }
  ),
  makeNavItem(
    "accounting-payroll",
    "accountingPayroll",
    "payments",
    "/accounting/payroll",
    PAGE_PERMISSIONS.accountingPayrollView,
    { groupId: "grp_finance" }
  ),
  makeNavItem(
    "accounting-carryover",
    "accountingCarryover",
    "accountBalanceWallet",
    "/accounting/carryover",
    PAGE_PERMISSIONS.accountingCarryoverView,
    { groupId: "grp_finance" }
  ),
  makeNavItem(
    "accounting-expenses",
    "accountingExpenses",
    "receiptLong",
    "/accounting/expenses",
    PAGE_PERMISSIONS.accountingExpensesView,
    { groupId: "grp_finance" }
  ),
  makeNavItem(
    "accounting-profits",
    "accountingProfits",
    "assessment",
    "/accounting/profits",
    PAGE_PERMISSIONS.accountingProfitsView,
    { groupId: "grp_finance" }
  ),
  makeNavItem(
    "payments",
    "accountingPayments",
    "payments",
    "/accounting/payments",
    PAGE_PERMISSIONS.accountingPaymentsView,
    { groupId: "grp_accounting" }
  ),
  makeNavItem(
    "payments-new",
    "accountingPaymentsNew",
    "noteAdd",
    "/accounting/payments/new",
    PAGE_PERMISSIONS.accountingPaymentsManage,
    { groupId: "grp_accounting" }
  ),
  makeNavItem(
    "packages",
    "accountingPackages",
    "packages",
    "/accounting/packages",
    PAGE_PERMISSIONS.accountingPaymentsView,
    { groupId: "grp_accounting" }
  ),
  makeNavItem(
    "packages-new",
    "accountingPackagesNew",
    "noteAdd",
    "/accounting/packages/new",
    PAGE_PERMISSIONS.accountingPaymentsManage,
    { groupId: "grp_accounting" }
  ),
];
