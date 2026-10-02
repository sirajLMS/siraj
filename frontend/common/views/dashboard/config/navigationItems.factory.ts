import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

type NavItemPermission = NavItem["permission"];
type NavItemExtra = Partial<Pick<NavItem, "audience" | "groupId" | "section">>;

/**
 * Compact constructor for a main-section nav item. Extra fields
 * (`audience` / `groupId` / `section`) are appended via the trailing
 * parameter so each entry stays a single line; omitting `extra` produces
 * the same shape as an inline literal without those keys.
 */
export const makeNavItem = (
  key: string,
  labelKey: NavItem["labelKey"],
  iconKey: NavItem["iconKey"],
  href: string,
  permission: NavItemPermission,
  extra?: NavItemExtra
): NavItem => ({
  key,
  labelKey,
  iconKey,
  href,
  section: "main",
  permission,
  ...extra,
});

/**
 * Factory: teacher nav items shared between sidebar and bottom nav.
 * These three items (today-classes, regular-schedule, your-students) are
 * identical in both arrays.
 */
export function makeTeacherNavItems(): readonly NavItem[] {
  return [
    makeNavItem("today-classes", "todayClasses", "calendarToday", "/dashboard", PAGE_PERMISSIONS.teacherDashboard, {
      audience: "teacher",
    }),
    makeNavItem(
      "regular-schedule",
      "regularSchedule",
      "eventRepeat",
      "/schedule/weekly",
      PAGE_PERMISSIONS.teacherWeeklySchedule,
      { audience: "teacher" }
    ),
    makeNavItem("your-students", "yourStudents", "group", "/students", PAGE_PERMISSIONS.teacherStudents, {
      audience: "teacher",
    }),
  ];
}

/**
 * Factory: student + supervisor nav items shared between sidebar and bottom nav.
 * The only difference is `teacher-dues` includes a `groupId` in the sidebar
 * (for visual grouping) but not in the bottom nav (which ignores groups).
 */
function makeStudentNavItems(): readonly NavItem[] {
  return [
    makeNavItem(
      "student-today-classes",
      "studentTodayClasses",
      "calendarToday",
      "/dashboard",
      PAGE_PERMISSIONS.studentSelfDashboard,
      { audience: "student" }
    ),
    makeNavItem(
      "student-schedule",
      "studentLessonHistory",
      "eventRepeat",
      "/students/history",
      PAGE_PERMISSIONS.studentOwnHistory,
      { audience: "student" }
    ),
    makeNavItem(
      "student-sessions",
      "studentSessions",
      "history",
      "/students/sessions",
      PAGE_PERMISSIONS.studentSessions,
      {
        audience: "student",
      }
    ),
    makeNavItem(
      "student-credits",
      "studentCredits",
      "accountBalanceWallet",
      "/students/credits",
      PAGE_PERMISSIONS.studentCredits,
      { audience: "student" }
    ),
    makeNavItem(
      "student-week-schedule",
      "studentWeekSchedule",
      "calendarToday",
      "/student/week-schedule",
      PAGE_PERMISSIONS.studentSessions,
      { audience: "student" }
    ),
    makeNavItem(
      "student-monthly-appraisals",
      "studentMonthlyAppraisals",
      "rateReview",
      "/student/monthly-appraisals",
      PAGE_PERMISSIONS.studentSessions,
      { audience: "student" }
    ),
    makeNavItem(
      "student-requests",
      "studentRequests",
      "assessment",
      "/student/requests",
      PAGE_PERMISSIONS.studentSessions,
      {
        audience: "student",
      }
    ),
  ];
}

/**
 * Factory: supervisor nav items shared between sidebar and bottom nav.
 * `teacher-dues` includes a `groupId` in the sidebar (for visual grouping)
 * but not in the bottom nav (which ignores groups).
 */
function makeSupervisorNavItems(includeGroupId: boolean): readonly NavItem[] {
  return [
    makeNavItem("supervisor-home", "supervisorHome", "dashboard", "/dashboard", PAGE_PERMISSIONS.supervisorDashboard, {
      audience: "supervisor",
    }),
    makeNavItem(
      "pending-reviews",
      "pendingReviews",
      "rateReview",
      "/lesson-reports",
      PAGE_PERMISSIONS.lessonReportsReview,
      { audience: "supervisor", groupId: "grp_reports" }
    ),
    makeNavItem("teacher-dues", "teacherDues", "payments", "/teacher-dues", PAGE_PERMISSIONS.teacherDuesView, {
      audience: "supervisor",
      ...(includeGroupId ? { groupId: "grp_finance" } : {}),
    }),
  ];
}

/**
 * Factory: student + supervisor nav items shared between sidebar and bottom nav.
 */
export function makeStudentSupervisorNavItems(includeGroupId: boolean): readonly NavItem[] {
  return [...makeStudentNavItems(), ...makeSupervisorNavItems(includeGroupId)];
}
