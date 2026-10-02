import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { makeNavItem } from "@/frontend/common/views/dashboard/config/navigationItems.factory";

/**
 * Nav items identical between the sidebar and the mobile bottom nav.
 * Defined once so both arrays reference the same objects instead of
 * duplicating the entries.
 */
export const homeNavItem = makeNavItem("home", "home", "dashboard", "/dashboard", PAGE_PERMISSIONS.dashboard);

export const billingParentNavItem = makeNavItem(
  "billing-parent",
  "invoices",
  "receiptLong",
  "/billing/invoices",
  PAGE_PERMISSIONS.billingParent,
  { audience: "parent" }
);

export const parentTodayClassesNavItem = makeNavItem(
  "parent-today-classes",
  "todayClasses",
  "calendarToday",
  "/dashboard",
  PAGE_PERMISSIONS.parentDashboard,
  { audience: "parent" }
);

export const parentYourStudentsNavItem = makeNavItem(
  "parent-your-students",
  "yourStudents",
  "group",
  "/students",
  PAGE_PERMISSIONS.parentStudents,
  { audience: "parent" }
);

export const parentSuggestNavItem = makeNavItem(
  "parent-suggest",
  "suggest",
  "lightbulb",
  "/suggestions",
  PAGE_PERMISSIONS.parentSuggest,
  { audience: "parent" }
);

export const complaintsSubmitNavItem = makeNavItem(
  "complaints-submit",
  "complaintsSubmit",
  "reportProblem",
  "/complaints",
  PAGE_PERMISSIONS.complaintsSubmit,
  { audience: "parent" }
);
