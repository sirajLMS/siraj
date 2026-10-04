// cspell:disable
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import {
  type AppPermission,
  AppPermission as AppPermissionEnum,
} from "@/frontend/common/graphql/generated/gql/graphql";

// Create Emotion caches for Storybook
const cacheLtr = createCache({
  key: "sb-ltr",
  prepend: true,
});

// Omit stylis `prefixer` — it crashes on `::placeholder` when paired with RTL (see emotion-cache.tsx).
const cacheRtl = createCache({
  key: "sb-rtl",
  prepend: true,
  stylisPlugins: [rtlPlugin],
});

export const STORYBOOK_CACHES = { ltr: cacheLtr, rtl: cacheRtl } as const;

export type ViewportGlobal = "mobile" | "tablet" | "desktop";

export const VIEWPORT_MAX_WIDTH: Record<ViewportGlobal, number | "none"> = {
  mobile: 600,
  tablet: 900,
  desktop: "none",
};

/**
 * Admin permissions seeded into the user store so stories can render
 * admin-only surfaces without a real session.
 */
export const STORYBOOK_ADMIN_PERMISSIONS: AppPermission[] = [
  AppPermissionEnum.AuthLogin,
  AppPermissionEnum.ProfileCoreIdentityViewOwn,
  AppPermissionEnum.DashboardView,
  AppPermissionEnum.DashboardViewMetrics,
  AppPermissionEnum.DashboardFilterMetrics,
  AppPermissionEnum.DashboardMetricsViewAll,
  AppPermissionEnum.ScheduleViewList,
  AppPermissionEnum.ScheduleFilterAdvanced,
  AppPermissionEnum.ScheduleViewAll,
  AppPermissionEnum.ScheduleViewAssigned,
  AppPermissionEnum.TeacherViewDashboard,
  AppPermissionEnum.ScheduleViewFamily,
  AppPermissionEnum.ScheduleSearchAvailability,
  AppPermissionEnum.ScheduleManageRecurring,
  AppPermissionEnum.ScheduleDstMigrate,
  AppPermissionEnum.SessionViewDetails,
  AppPermissionEnum.SessionActivateClass,
  AppPermissionEnum.SessionActivateOverride,
  AppPermissionEnum.SessionUpdateStatusStart,
  AppPermissionEnum.SessionUpdateStatusAbsent,
  AppPermissionEnum.SessionUpdateStatusLeave,
  AppPermissionEnum.SessionReschedule,
  AppPermissionEnum.SessionReset,
  AppPermissionEnum.TeachersList,
  AppPermissionEnum.TeachersCreate,
  AppPermissionEnum.TeachersEdit,
  AppPermissionEnum.TeachersManageSchedule,
  AppPermissionEnum.ParentsList,
  AppPermissionEnum.ParentsCreate,
  AppPermissionEnum.ParentsEdit,
  AppPermissionEnum.StudentsList,
  AppPermissionEnum.StudentsEdit,
  AppPermissionEnum.StudentsChangeTeacher,
  AppPermissionEnum.StudentsChangeStatus,
  AppPermissionEnum.StudentsOverrideQuota,
  AppPermissionEnum.InvoicesList,
  AppPermissionEnum.InvoicesDelete,
  AppPermissionEnum.InvoicesCreate,
  AppPermissionEnum.InvoicesMarkPaid,
  AppPermissionEnum.InvoicesEdit,
  AppPermissionEnum.ResourcesList,
  AppPermissionEnum.ResourcesDelete,
  AppPermissionEnum.ResourcesUpload,
  AppPermissionEnum.ReportsGenerate,
  AppPermissionEnum.ComplaintsList,
  AppPermissionEnum.ComplaintsDelete,
  AppPermissionEnum.ComplaintsRespond,
  AppPermissionEnum.StaffList,
  AppPermissionEnum.StaffCreate,
  AppPermissionEnum.StaffEdit,
  AppPermissionEnum.PermissionGroupsManage,
  AppPermissionEnum.PermissionGroupsAssign,
];
