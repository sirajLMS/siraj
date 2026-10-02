import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NavGroup } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Sidebar navigation GROUPS — labelled, optionally-collapsible clusters of
 * nav items. Each item in {@link SIDEBAR_NAV_ITEMS} can reference a group
 * via its `groupId` field; the renderer groups items under their matching
 * header (with optional `<Divider>` separator + `Collapse` animation).
 *
 * Portals (teacher/parent/student/supervisor) attach audience to specific
 * items rather than relying on groups — so for portals the groups array is
 * effectively decorative: empty groups are dropped by
 * `getNavItemsForPermissions` so portal users won't see empty headers.
 *
 * Group                     | Items (key)                          | Permission gate (any-of)
 * --------------------------|--------------------------------------|------------------------------
 * grp_users                 | teachers, parents, students, staff   | StaffViewDirectory / ParentsList / TeacherViewStudents / StudentsList
 * grp_schedule              | schedule-tracking, schedule-alerts   | per-item
 * grp_content               | subjects, classes, resources         | ResourcesList / SubjectsList
 * grp_finance               | billing, quotas, payment-catalogs    | BillingViewHistory / BillingManageCurrencyHedges / Accounting*
 * grp_accounting            | payments, payments-new, packages     | AccountingPaymentsView / AccountingPaymentsManage
 * grp_reports               | reports, monthly-reports, teacher-dues, lesson-reports | per-item
 * grp_feedback              | complaints-manage, suggestions-manage | ComplaintsRespond|ComplaintsList / SuggestionsList
 * grp_admin                 | permissions, settings, dst-migration | PermissionGroupsManage / SettingsView* / SystemBulkUpdateDst
 * grp_integrations          | whatsapp-settings, whatsapp-conversations | WhatsappView / WhatsappConfigManage / WhatsappConversationsView
 */
export const SIDEBAR_NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "grp_users",
    labelKey: "navGroupUsers",
    iconKey: "group",
    section: "main",
    permission: [
      AppPermission.TeachersList,
      AppPermission.ParentsList,
      AppPermission.TeacherViewStudents,
      AppPermission.StudentsList,
    ],
  },
  {
    id: "grp_schedule",
    labelKey: "navGroupSchedule",
    iconKey: "eventRepeat",
    section: "main",
    permission: [
      AppPermission.ScheduleSearchAvailability,
      AppPermission.SessionReschedule,
      AppPermission.ScheduleViewAll,
      AppPermission.ScheduleViewList,
      AppPermission.ScheduleManageRecurring,
    ],
    separator: true,
  },
  {
    id: "grp_content",
    labelKey: "navGroupContent",
    iconKey: "folderOpen",
    section: "main",
    permission: [AppPermission.ResourcesList, AppPermission.SubjectsList, AppPermission.SessionViewDetails],
    separator: true,
  },
  {
    id: "grp_finance",
    labelKey: "navGroupFinance",
    iconKey: "payments",
    section: "main",
    permission: [
      AppPermission.BillingViewHistory,
      AppPermission.BillingViewExchangeRates,
      AppPermission.BillingManageCurrencyHedges,
      AppPermission.BillingCreateInvoice,
      AppPermission.PaymentMethodsManageCatalogs,
      AppPermission.MeetingProvidersManageCatalog,
      AppPermission.TeacherDuesView,
      AppPermission.QuotasView,
      AppPermission.QuotasManage,
      AppPermission.AccountingCreditsManage,
      AppPermission.AccountingPayrollView,
      AppPermission.AccountingCarryoverView,
      AppPermission.AccountingExpensesView,
      AppPermission.AccountingProfitsView,
    ],
    separator: true,
  },

  {
    id: "grp_accounting",
    labelKey: "navGroupAccounting",
    iconKey: "payments",
    section: "main",
    permission: [AppPermission.AccountingPaymentsView, AppPermission.AccountingPaymentsManage],
    separator: true,
  },
  {
    id: "grp_reports",
    labelKey: "navGroupReports",
    iconKey: "assessment",
    section: "main",
    permission: [
      AppPermission.ReportGenerateCustom,
      AppPermission.MonthlyReportsView,
      AppPermission.LessonReportsReview,
      AppPermission.LessonReportsApprove,
      AppPermission.AccountingReportsView,
    ],
    separator: true,
  },
  {
    id: "grp_feedback",
    labelKey: "navGroupFeedback",
    iconKey: "reportProblem",
    section: "main",
    permission: [AppPermission.ComplaintsRespond, AppPermission.ComplaintsList, AppPermission.SuggestionsList],
    separator: true,
  },
  {
    id: "grp_admin",
    labelKey: "navGroupAdmin",
    iconKey: "security",
    section: "main",
    permission: [
      AppPermission.PermissionGroupsManage,
      AppPermission.SettingsView,
      AppPermission.SystemBulkUpdateDst,
      AppPermission.CronManage,
      AppPermission.SettingsEditMeetingIntegrations,
    ],
    separator: true,
  },
  {
    id: "grp_integrations",
    labelKey: "navGroupIntegrations",
    iconKey: "hub",
    section: "main",
    permission: [
      AppPermission.WhatsappView,
      AppPermission.WhatsappConfigManage,
      AppPermission.WhatsappConversationsView,
      AppPermission.WhatsappGroupsView,
    ],
    separator: true,
  },
] as const;
