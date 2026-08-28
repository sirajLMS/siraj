import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

const SUPER_ADMIN_PERMISSIONS: AppPermission[] = [
  AppPermission.AuthLogin,
  AppPermission.ProfileCoreIdentityViewOwn,
  AppPermission.DashboardView,
  AppPermission.DashboardViewMetrics,
  AppPermission.DashboardFilterMetrics,
  AppPermission.DashboardMetricsViewAll,
  AppPermission.DashboardSearch,
  AppPermission.ScheduleViewList,
  AppPermission.ScheduleFilterAdvanced,
  AppPermission.ScheduleViewAll,
  AppPermission.ScheduleViewAssigned,
  AppPermission.ScheduleViewFamily,
  AppPermission.ScheduleSearchAvailability,
  AppPermission.ScheduleManageRecurring,
  AppPermission.ScheduleDstMigrate,
  AppPermission.ScheduleViewTimezones,
  AppPermission.SessionViewDetails,
  AppPermission.SessionActivateClass,
  AppPermission.SessionActivateOverride,
  AppPermission.SessionUpdateStatusStart,
  AppPermission.SessionUpdateStatusAbsent,
  AppPermission.SessionUpdateStatusLeave,
  AppPermission.SessionReschedule,
  AppPermission.SessionReset,
  AppPermission.SessionOverrideActions,
  AppPermission.HistoryViewCalendar,
  AppPermission.HistoryViewDetails,
  AppPermission.TeacherViewDashboard,
  AppPermission.TeacherViewStudents,
  AppPermission.ProfileCoreIdentityViewOwn,
  AppPermission.TeachersList,
  AppPermission.TeachersCreate,
  AppPermission.TeachersEdit,
  AppPermission.TeachersManageSchedule,
  AppPermission.ParentsList,
  AppPermission.ParentsCreate,
  AppPermission.ParentsEdit,
  AppPermission.StudentsList,
  AppPermission.StudentsEdit,
  AppPermission.StudentsChangeTeacher,
  AppPermission.StudentsChangeStatus,
  AppPermission.StudentsOverrideQuota,
  AppPermission.InvoicesList,
  AppPermission.InvoicesDelete,
  AppPermission.InvoicesCreate,
  AppPermission.InvoicesMarkPaid,
  AppPermission.InvoicesEdit,
  AppPermission.ResourcesList,
  AppPermission.ResourcesDelete,
  AppPermission.ResourcesUpload,
  AppPermission.ReportsGenerate,
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsDelete,
  AppPermission.ComplaintsRespond,
  AppPermission.StaffList,
  AppPermission.StaffCreate,
  AppPermission.StaffEdit,
  AppPermission.PermissionGroupsManage,
  AppPermission.PermissionGroupsAssign,
  AppPermission.NotificationViewAlerts,
  AppPermission.BillingViewUnpaidInvoices,
  AppPermission.ProfileCoreIdentityViewOther,
  AppPermission.StaffViewDirectory,
  AppPermission.ScheduleViewWeekly,
  AppPermission.ScheduleViewWorkload,
  AppPermission.ScheduleCreateClass,
  AppPermission.ScheduleDeleteClass,
  AppPermission.ScheduleClearWeekly,
  AppPermission.ProfileStaffRoleEditOther,
  AppPermission.SystemBulkUpdateDst,
  AppPermission.ParentViewDirectory,
  AppPermission.ProfileParentSocialViewOther,
  AppPermission.ParentViewStudents,
  AppPermission.ProfileCoreIdentityViewOwn,
  AppPermission.ParentManageStatus,
  AppPermission.StudentViewAssociated,
  AppPermission.StudentEditQuota,
  AppPermission.BillingViewHistory,
  AppPermission.DocumentManageParentDocs,
  AppPermission.BillingCreateInvoice,
  AppPermission.BillingUpdateStatusPaid,
  AppPermission.BillingDeleteInvoice,
  AppPermission.StudentReassignTeacher,
  AppPermission.StudentManageStatus,
  AppPermission.ReportGenerateCustom,
  AppPermission.ReportViewFinancials,
  AppPermission.SupportSubmitComplaint,
  AppPermission.SupportViewHistory,
  AppPermission.CommunicationSubmitSuggestion,
  AppPermission.SuggestionsList,
  AppPermission.SuggestionsReview,
  AppPermission.SuggestionsDelete,
];

describe("super admin sidebar navigation", () => {
  test("shows admin items and hides teacher/parent portal items", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, SUPER_ADMIN_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("home");
    expect(keys).toContain("teachers");
    expect(keys).toContain("parents");
    expect(keys).toContain("students");
    expect(keys).toContain("feedback-manage");
    expect(keys).not.toContain("suggestions-manage");
    expect(keys).not.toContain("complaints-manage");
    expect(keys).toContain("permissions");
    expect(keys).toContain("dst-migration");
    expect(keys).toContain("reports");
    expect(keys).toContain("billing-admin");
    expect(keys).not.toContain("logout");

    expect(keys).not.toContain("today-classes");
    expect(keys).not.toContain("regular-schedule");
    expect(keys).not.toContain("your-students");
    expect(keys).not.toContain("teacher-salary");
    expect(keys).not.toContain("teacher-rules");
    expect(keys).not.toContain("parent-today-classes");
    expect(keys).not.toContain("parent-your-students");
    expect(keys).not.toContain("parent-suggest");
    expect(keys).not.toContain("parent-rules");
    expect(keys).not.toContain("parent-social");
    expect(keys).not.toContain("billing-parent");
    expect(keys).not.toContain("complaints-submit");
    expect(keys).not.toContain("suggestions-submit");
  });
});
