import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import {
  makeNavItem,
  makeStudentSupervisorNavItems,
  makeTeacherNavItems,
} from "@/frontend/common/views/dashboard/config/navigationItems.factory";
import {
  billingParentNavItem,
  complaintsSubmitNavItem,
  homeNavItem,
  parentSuggestNavItem,
  parentTodayClassesNavItem,
  parentYourStudentsNavItem,
} from "@/frontend/common/views/dashboard/config/navigationItems.pinned";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Bottom navigation items for mobile, condensed.
 *
 * Bottom nav stays FLAT — it intentionally ignores `groupId` because the
 * bottom bar is space-constrained and groups don't translate to a
 * horizontal scrollrail. The `key` matches the sidebar counterpart for each
 * entry so callers can use the same `getActiveNavKey` against this list.
 */
export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  ...makeTeacherNavItems(),
  homeNavItem,
  makeNavItem("schedule", "schedule", "calendarToday", "/dashboard", AppPermission.DashboardView),
  makeNavItem("resources", "resources", "folderOpen", "/resources", PAGE_PERMISSIONS.resources),
  makeNavItem("teachers", "teachers", "school", "/teachers", PAGE_PERMISSIONS.teachers),
  makeNavItem("students", "students", "group", "/students", PAGE_PERMISSIONS.students),
  makeNavItem("parents", "parents", "diversity1", "/parents", PAGE_PERMISSIONS.parents),
  makeNavItem("subjects", "subjects", "category", "/subjects", PAGE_PERMISSIONS.subjects),
  makeNavItem("reports", "reports", "assessment", "/reports", PAGE_PERMISSIONS.reports),
  makeNavItem("billing-admin", "billingAdmin", "payments", "/billing", PAGE_PERMISSIONS.billingAdmin),
  makeNavItem("quotas", "quotas", "accountBalanceWallet", "/quotas", PAGE_PERMISSIONS.quotas),
  makeNavItem("quotas-create", "quotasCreate", "noteAdd", "/quotas/new", PAGE_PERMISSIONS.quotasCreate),
  makeNavItem(
    "accounting-payments",
    "accountingPayments",
    "payments",
    "/accounting/payments",
    PAGE_PERMISSIONS.accountingPaymentsView
  ),
  makeNavItem(
    "payment-catalogs",
    "paymentCatalogs",
    "accountBalanceWallet",
    "/payment-catalogs",
    PAGE_PERMISSIONS.paymentCatalogsParent
  ),
  billingParentNavItem,
  parentTodayClassesNavItem,
  parentYourStudentsNavItem,
  parentSuggestNavItem,
  ...makeStudentSupervisorNavItems(false),
  complaintsSubmitNavItem,
  makeNavItem(
    "feedback-manage",
    "feedbackManage",
    "reportProblem",
    "/feedback/manage",
    PAGE_PERMISSIONS.feedbackManageParent
  ),
];
