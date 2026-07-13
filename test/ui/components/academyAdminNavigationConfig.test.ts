import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";

const ACADEMY_ADMIN_PERMISSIONS: AppPermission[] = [
  AppPermission.AuthLogin,
  AppPermission.AuthViewOwnProfile,
  AppPermission.DashboardViewMetrics,
  AppPermission.DashboardFilterMetrics,
  AppPermission.DashboardSearch,
  AppPermission.ScheduleViewList,
  AppPermission.ScheduleFilterAdvanced,
  AppPermission.ScheduleViewTimezones,
  AppPermission.HistoryViewCalendar,
  AppPermission.HistoryViewDetails,
  AppPermission.SessionOverrideActions,
  AppPermission.SessionViewDetails,
  AppPermission.SessionActivateOverride,
  AppPermission.SessionReschedule,
  AppPermission.SessionReset,
  AppPermission.SessionUpdateStatusStart,
  AppPermission.SessionUpdateStatusAbsent,
  AppPermission.SessionUpdateStatusLeave,
  AppPermission.NotificationViewAlerts,
  AppPermission.BillingViewUnpaidInvoices,
  AppPermission.UserViewProfile,
  AppPermission.ScheduleSearchAvailability,
  AppPermission.StaffViewDirectory,
  AppPermission.ScheduleViewWeekly,
  AppPermission.ScheduleViewWorkload,
  AppPermission.ScheduleCreateClass,
  AppPermission.ScheduleDeleteClass,
  AppPermission.ScheduleClearWeekly,
  AppPermission.StaffEditProfile,
  AppPermission.ParentViewDirectory,
  AppPermission.ParentViewProfile,
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
  AppPermission.StudentsList,
  AppPermission.ResourcesList,
  AppPermission.ResourcesUpload,
  AppPermission.ResourcesDelete,
  AppPermission.ReportGenerateCustom,
  AppPermission.ReportViewFinancials,
  AppPermission.TeachersCreate,
  AppPermission.ParentsCreate,
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsDelete,
  AppPermission.ComplaintsRespond,
  AppPermission.SuggestionsList,
  AppPermission.SuggestionsReview,
];

describe("academy admin sidebar navigation", () => {
  test("shows admin items including suggestions and complaints management", () => {
    const items = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, ACADEMY_ADMIN_PERMISSIONS);
    const keys = items.map(item => item.key);

    expect(keys).toContain("home");
    expect(keys).toContain("students");
    expect(keys).toContain("suggestions-manage");
    expect(keys).toContain("complaints-manage");
    expect(keys).toContain("reports");
    expect(keys).toContain("billing-admin");
    expect(keys).toContain("logout");
    expect(keys).not.toContain("parent-your-students");
    expect(keys).not.toContain("your-students");
    expect(keys).not.toContain("today-classes");
    expect(keys).not.toContain("regular-schedule");
    expect(keys).not.toContain("teacher-salary");
    expect(keys).not.toContain("teacher-rules");
    expect(keys).not.toContain("complaints-submit");
    expect(keys).not.toContain("suggestions-submit");
    expect(keys).not.toContain("parent-social");
  });
});
