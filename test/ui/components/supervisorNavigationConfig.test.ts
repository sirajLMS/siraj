import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

/** Mirrors SUPERVISOR_DEFAULT seed grants (without admin metrics). */
const SUPERVISOR_PERMISSIONS: AppPermission[] = [
  AppPermission.DashboardView,
  AppPermission.SupervisorViewDashboard,
  AppPermission.LessonReportsReview,
  AppPermission.LessonReportsApprove,
  AppPermission.LessonReportsReject,
  AppPermission.TeacherDuesView,
  AppPermission.MonthlyReportsView,
  AppPermission.ProfileCoreIdentityViewOwn,
  AppPermission.ScheduleViewList,
  AppPermission.ScheduleViewAssigned,
  AppPermission.SessionViewDetails,
  AppPermission.HistoryViewCalendar,
  AppPermission.HistoryViewDetails,
  AppPermission.TeachersList,
  AppPermission.TeachersCreate,
  AppPermission.TeachersEdit,
  AppPermission.TeachersManageSchedule,
  AppPermission.StudentsList,
  AppPermission.StudentsCreate,
  AppPermission.StudentsEdit,
  AppPermission.StudentReassignTeacher,
  AppPermission.StudentManageStatus,
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsRespond,
];

describe("supervisor sidebar navigation", () => {
  test("shows supervisor portal items for supervisor users", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, SUPERVISOR_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("supervisor-home");
    expect(keys).toContain("pending-reviews");
    expect(keys).toContain("teacher-dues");
    expect(keys).toContain("monthly-reports");
    expect(keys).not.toContain("supervisor-profile");
    expect(keys).not.toContain("logout");

    expect(keys).not.toContain("home");
    expect(keys).not.toContain("own-profile");
    expect(keys).not.toContain("search-schedule");
    expect(keys).not.toContain("schedule-tracking");
    expect(keys).not.toContain("status-tracking");
    expect(keys).not.toContain("schedule-alerts");
    expect(keys).toContain("teachers");
    expect(keys).toContain("students");
    expect(keys).not.toContain("staff");
    expect(keys).not.toContain("users-directory");
    expect(keys).not.toContain("permissions");
    expect(keys).not.toContain("feedback-manage");

    expect(keys).not.toContain("today-classes");
    expect(keys).not.toContain("regular-schedule");
    expect(keys).not.toContain("your-students");
    expect(keys).not.toContain("teacher-rules");

    expect(keys).not.toContain("parent-today-classes");
    expect(keys).not.toContain("parent-your-students");
    expect(keys).not.toContain("billing-parent");
    expect(keys).not.toContain("student-today-classes");
    expect(keys).not.toContain("student-credits");
  });

  test("does not treat supervisors with admin metrics as portal users", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, [
      ...SUPERVISOR_PERMISSIONS,
      AppPermission.DashboardViewMetrics,
    ]);
    const keys = items.map(item => item.key);

    expect(keys).not.toContain("supervisor-home");
    expect(keys).not.toContain("pending-reviews");
    expect(keys).toContain("home");
  });

  test("SUPERADMIN sees supervisor-only items (pending-reviews, teacher-dues, monthly-reports) but NOT supervisor-home or supervisor-profile", () => {
    // SUPERADMIN holds PermissionGroupsManage (the super_admin discriminator)
    // along with DashboardViewMetrics (admin metrics) and all 4 supervisor
    // route permissions seeded for super_admin in
    // 20260728171744_custom_6-lms-permissions-and-groups/migration.sql.
    const SUPERADMIN_PERMISSIONS: AppPermission[] = [
      AppPermission.DashboardView,
      AppPermission.DashboardViewMetrics,
      AppPermission.PermissionGroupsManage,
      AppPermission.SupervisorViewDashboard,
      AppPermission.LessonReportsReview,
      AppPermission.LessonReportsApprove,
      AppPermission.TeacherDuesView,
      AppPermission.MonthlyReportsView,
      AppPermission.ProfileCoreIdentityViewOwn,
    ];
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, SUPERADMIN_PERMISSIONS);
    const keys = items.map(item => item.key);

    // The 3 supervisor-only route items become visible to SUPERADMIN.
    expect(keys).toContain("pending-reviews");
    expect(keys).toContain("teacher-dues");
    expect(keys).toContain("monthly-reports");
    expect(keys).not.toContain("supervisor-profile");

    // supervisor-home stays HIDDEN for SUPERADMIN because the admin `home`
    // item already serves /dashboard (user decision: consolidate).
    expect(keys).not.toContain("supervisor-home");

    // The admin `home` item still shows for SUPERADMIN.
    expect(keys).toContain("home");
  });
});
