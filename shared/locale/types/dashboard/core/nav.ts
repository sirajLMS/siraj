/**
 * DashboardNavigationLabels — type schema for the dashboard.core.nav namespace.
 *
 * All entries are static navigation labels (strings only).
 */
export interface DashboardNavigationLabels {
  readonly home: string;
  readonly scheduleSearch: string;
  readonly scheduleTracking: string;
  readonly scheduleTrackingParent: string;
  readonly statusTracking: string;
  readonly scheduleAlerts: string;
  readonly teachers: string;
  readonly parents: string;
  readonly students: string;
  readonly studentHistory: string;
  readonly studentQuota: string;
  readonly studentStatus: string;
  readonly staff: string;
  readonly resources: string;
  readonly subjects: string;
  readonly report: string;
  readonly addAccount: string;
  readonly logout: string;
  readonly schedule: string;
  readonly reports: string;
  readonly classDetails: string;
  readonly classAudit: string;
  readonly createClass: string;
  readonly teacherAvailability: string;
  readonly teacherWeeklySchedule: string;
  readonly teacherFutureSchedule: string;
  readonly teacherReassignment: string;
  readonly teacherOnboarding: string;
  readonly parentOnboarding: string;
  readonly staffOnboarding: string;
  readonly studentOnboarding: string;
  readonly scheduleReschedule: string;
  readonly dstMigration: string;
  readonly billingAdmin: string;
  readonly quotas: string;
  readonly quotasCreate: string;
  readonly quotasView: string;
  readonly quotasEdit: string;
  readonly quotasInsights: string;
  readonly exchangeRates: string;

  readonly supportedCurrencies: string;
  readonly currencyHedges: string;
  readonly paymentCatalogs: string;
  readonly feedbackManage: string;
  readonly usersDirectory: string;
  readonly meetingProviders: string;
  readonly billingParent: string;
  readonly billingManual: string;
  readonly suggestionsSubmit: string;
  readonly suggestionsManage: string;
  readonly complaintsSubmit: string;
  readonly complaintsManage: string;
  readonly teacherDashboard: string;
  readonly teacherDashboardActive: string;
  readonly todayClasses: string;
  readonly regularSchedule: string;
  readonly yourStudents: string;
  readonly teacherClassList: string;
  readonly yourProfile: string;
  readonly salaryDetails: string;
  readonly teacherRules: string;
  readonly suggest: string;
  readonly invoices: string;
  readonly parentRules: string;
  readonly socialMedia: string;
  readonly permissions: string;
  readonly settings: string;
  readonly whatsappSettings: string;
  readonly booksAndBags: string;
  readonly studentTodayClasses: string;
  readonly studentSchedule: string;
  readonly studentLessonHistory: string;
  readonly studentSessions: string;
  readonly studentCredits: string;
  readonly studentProfile: string;
  readonly lessonReports: string;
  readonly supervisorHome: string;
  readonly pendingReviews: string;
  readonly teacherDues: string;
  readonly monthlyReports: string;
  readonly supervisorProfile: string;
  /**
   * Sidebar group labels. Each maps to a `NavGroup.labelKey` in
   * `frontend/common/views/dashboard/config/navigationConfig.ts`. Portal
   * users generally have few nav items so they don't see group headers —
   * the labels are admin/supervisor-facing.
   */
  readonly navGroupHome: string;
  readonly navGroupPeople: string;
  readonly navGroupUsers: string;
  readonly navGroupContent: string;
  readonly navGroupFinance: string;
  readonly navGroupSchedule: string;
  readonly navGroupBilling: string;
  readonly navGroupCatalogs: string;
  readonly navGroupFeedback: string;
  readonly navGroupReports: string;
  readonly navGroupAdmin: string;
  readonly navGroupIntegrations: string;
  readonly navGroupResources: string;
  readonly navGroupClasses: string;
  readonly navGroupAccount: string;
  readonly nav: {
    readonly logout: string;
    readonly impersonation: {
      readonly returnToNormalLogin: string;
    };
    readonly groupSimulation: {
      readonly returnToNormalRole: string;
    };
  };
}
