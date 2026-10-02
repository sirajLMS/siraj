import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import {
  makeNavItem,
  makeStudentSupervisorNavItems,
  makeTeacherNavItems,
} from "@/frontend/common/views/dashboard/config/navigationItems.factory";
import {
  billingParentNavItem,
  homeNavItem,
  parentSuggestNavItem,
  parentTodayClassesNavItem,
  parentYourStudentsNavItem,
} from "@/frontend/common/views/dashboard/config/navigationItems.pinned";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Portal-audience sidebar entries: teacher, parent, student and supervisor
 * items (plus the shared factories they reuse). Portal-audience items
 * intentionally have NO `groupId` — they stay flat because portal nav is too
 * short to benefit from grouping, and audience overrides can vary per item.
 */
export const SIDEBAR_PORTAL_NAV_ITEMS: readonly NavItem[] = [
  homeNavItem,
  ...makeTeacherNavItems(),
  makeNavItem("teacher-class-details", "teacherClassList", "class", "/classes", PAGE_PERMISSIONS.teacherClassDetails, {
    audience: "teacher",
  }),
  makeNavItem(
    "teacher-lesson-reports",
    "lessonReports",
    "rateReview",
    "/teachers/lesson-reports",
    PAGE_PERMISSIONS.teacherDashboard,
    { audience: "teacher" }
  ),
  makeNavItem("teacher-rules", "teacherRules", "description", "/teachers/rules", PAGE_PERMISSIONS.teacherRules, {
    audience: "teacher",
  }),
  parentTodayClassesNavItem,
  parentYourStudentsNavItem,
  billingParentNavItem,
  parentSuggestNavItem,
  makeNavItem("parent-rules", "parentRules", "description", "/parents/rules", PAGE_PERMISSIONS.parentRules, {
    audience: "parent",
  }),
  makeNavItem("parent-social", "socialMedia", "share", "/parents/social", PAGE_PERMISSIONS.parentOwnProfile, {
    audience: "parent",
    section: "footer",
  }),
  makeNavItem(
    "parent-payments-ledger",
    "parentPaymentsLedger",
    "payments",
    "/parent/payments",
    PAGE_PERMISSIONS.parentOwnProfile,
    { audience: "parent" }
  ),
  makeNavItem(
    "parent-monthly-appraisals",
    "parentMonthlyAppraisals",
    "rateReview",
    "/parent/monthly-appraisals",
    PAGE_PERMISSIONS.parentOwnProfile,
    { audience: "parent" }
  ),
  makeNavItem(
    "parent-requests",
    "parentRequests",
    "assessment",
    "/parent/requests",
    PAGE_PERMISSIONS.parentOwnProfile,
    {
      audience: "parent",
    }
  ),
  ...makeStudentSupervisorNavItems(true),
  makeNavItem(
    "monthly-reports",
    "monthlyReports",
    "assessment",
    "/monthly-reports",
    PAGE_PERMISSIONS.monthlyReportsView,
    { audience: "supervisor", groupId: "grp_reports" }
  ),
];
