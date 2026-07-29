#!/usr/bin/env bun
/**
 * Phase 2 dashboard namespace generator + call-site migrator.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = join(import.meta.dir, "..");

interface NamespaceDef {
  readonly handle: string;
  readonly typeImport: string;
  readonly typePath: string;
  readonly enImport: string;
  readonly enExport: string;
  readonly arExport: string;
  readonly nsPath: string;
  readonly legacyKey: string;
}

const namespaces: NamespaceDef[] = [
  {
    handle: "DashboardSettings",
    legacyKey: "settings",
    typePath: "dashboard/settings/main",
    typeImport: "SettingsLabels",
    enImport: "dashboard/settings/main",
    enExport: "dashboardSettingsEn",
    arExport: "dashboardSettingsAr",
    nsPath: "dashboard/settings/main.namespace.ts",
  },
  {
    handle: "DashboardSettingsGeneral",
    legacyKey: "settings.general",
    typePath: "dashboard/settings/general",
    typeImport: "SettingsGeneralTabLabels",
    enImport: "dashboard/settings/general",
    enExport: "dashboardSettingsGeneralEn",
    arExport: "dashboardSettingsGeneralAr",
    nsPath: "dashboard/settings/general.namespace.ts",
  },
  {
    handle: "DashboardSettingsTimezones",
    legacyKey: "settings.timezones",
    typePath: "dashboard/settings/timezones",
    typeImport: "SettingsTimezonesLabels",
    enImport: "dashboard/settings/timezones",
    enExport: "dashboardSettingsTimezonesEn",
    arExport: "dashboardSettingsTimezonesAr",
    nsPath: "dashboard/settings/timezones.namespace.ts",
  },
  {
    handle: "DashboardSettingsSession",
    legacyKey: "settings.session",
    typePath: "dashboard/settings/session",
    typeImport: "SettingsSessionTabLabels",
    enImport: "dashboard/settings/session",
    enExport: "dashboardSettingsSessionEn",
    arExport: "dashboardSettingsSessionAr",
    nsPath: "dashboard/settings/session.namespace.ts",
  },
  {
    handle: "DashboardSettingsEnvironment",
    legacyKey: "settings.environment",
    typePath: "dashboard/settings/environment",
    typeImport: "SettingsEnvironmentLabels",
    enImport: "dashboard/settings/environment",
    enExport: "dashboardSettingsEnvironmentEn",
    arExport: "dashboardSettingsEnvironmentAr",
    nsPath: "dashboard/settings/environment.namespace.ts",
  },
  {
    handle: "DashboardSettingsSiteContent",
    legacyKey: "settings.siteContent",
    typePath: "dashboard/settings/siteContent",
    typeImport: "SettingsSiteContentTabLabels",
    enImport: "dashboard/settings/siteContent",
    enExport: "dashboardSettingsSiteContentEn",
    arExport: "dashboardSettingsSiteContentAr",
    nsPath: "dashboard/settings/siteContent.namespace.ts",
  },
  {
    handle: "DashboardClassesMain",
    legacyKey: "classesMain",
    typePath: "dashboard/classes/main",
    typeImport: "MainLabels",
    enImport: "dashboard/classes/main",
    enExport: "dashboardClassesMainEn",
    arExport: "dashboardClassesMainAr",
    nsPath: "dashboard/classes/main.namespace.ts",
  },
  {
    handle: "DashboardClassAudit",
    legacyKey: "classAudit",
    typePath: "dashboard/classes/audit",
    typeImport: "ClassAuditLabels",
    enImport: "dashboard/classes/audit",
    enExport: "dashboardClassAuditEn",
    arExport: "dashboardClassAuditAr",
    nsPath: "dashboard/classes/audit.namespace.ts",
  },
  {
    handle: "DashboardClassDetails",
    legacyKey: "classDetails",
    typePath: "dashboard/classes/details",
    typeImport: "ClassDetailsLabels",
    enImport: "dashboard/classes/details",
    enExport: "dashboardClassDetailsEn",
    arExport: "dashboardClassDetailsAr",
    nsPath: "dashboard/classes/details.namespace.ts",
  },
  {
    handle: "DashboardCreateRecurringClass",
    legacyKey: "createRecurringClass",
    typePath: "dashboard/classes/createRecurringClass",
    typeImport: "CreateRecurringClassLabels",
    enImport: "dashboard/classes/createRecurringClass",
    enExport: "dashboardCreateRecurringClassEn",
    arExport: "dashboardCreateRecurringClassAr",
    nsPath: "dashboard/classes/createRecurringClass.namespace.ts",
  },
  {
    handle: "DashboardRescheduleForm",
    legacyKey: "rescheduleForm",
    typePath: "dashboard/classes/rescheduleForm",
    typeImport: "RescheduleFormLabels",
    enImport: "dashboard/classes/rescheduleForm",
    enExport: "dashboardRescheduleFormEn",
    arExport: "dashboardRescheduleFormAr",
    nsPath: "dashboard/classes/rescheduleForm.namespace.ts",
  },
  {
    handle: "DashboardRescheduleTracking",
    legacyKey: "rescheduleTracking",
    typePath: "dashboard/classes/rescheduleTracking",
    typeImport: "RescheduleTrackingLabels",
    enImport: "dashboard/classes/rescheduleTracking",
    enExport: "dashboardRescheduleTrackingEn",
    arExport: "dashboardRescheduleTrackingAr",
    nsPath: "dashboard/classes/rescheduleTracking.namespace.ts",
  },
  {
    handle: "DashboardTeachersDirectory",
    legacyKey: "teachersDirectory",
    typePath: "dashboard/teachers/directory",
    typeImport: "TeachersDirectoryLabels",
    enImport: "dashboard/teachers/directory",
    enExport: "dashboardTeachersDirectoryEn",
    arExport: "dashboardTeachersDirectoryAr",
    nsPath: "dashboard/teachers/directory.namespace.ts",
  },
  {
    handle: "DashboardTeacherDashboard",
    legacyKey: "teacherDashboard",
    typePath: "dashboard/teachers/dashboard",
    typeImport: "TeacherDashboardLabels",
    enImport: "dashboard/teachers/dashboard",
    enExport: "dashboardTeacherDashboardEn",
    arExport: "dashboardTeacherDashboardAr",
    nsPath: "dashboard/teachers/dashboard.namespace.ts",
  },
  {
    handle: "DashboardTeacherOnboarding",
    legacyKey: "teacherOnboarding",
    typePath: "dashboard/teachers/onboarding",
    typeImport: "TeacherOnboardingLabels",
    enImport: "dashboard/teachers/onboarding",
    enExport: "dashboardTeacherOnboardingEn",
    arExport: "dashboardTeacherOnboardingAr",
    nsPath: "dashboard/teachers/onboarding.namespace.ts",
  },
  {
    handle: "DashboardTeacherOwnProfile",
    legacyKey: "teacherOwnProfile",
    typePath: "dashboard/teachers/ownProfile",
    typeImport: "TeacherOwnProfileLabels",
    enImport: "dashboard/teachers/ownProfile",
    enExport: "dashboardTeacherOwnProfileEn",
    arExport: "dashboardTeacherOwnProfileAr",
    nsPath: "dashboard/teachers/ownProfile.namespace.ts",
  },
  {
    handle: "DashboardTeacherProfile",
    legacyKey: "teacherProfile",
    typePath: "dashboard/teachers/profile",
    typeImport: "TeacherProfileLabels",
    enImport: "dashboard/teachers/profile",
    enExport: "dashboardTeacherProfileEn",
    arExport: "dashboardTeacherProfileAr",
    nsPath: "dashboard/teachers/profile.namespace.ts",
  },
  {
    handle: "DashboardTeacherReassignment",
    legacyKey: "teacherReassignment",
    typePath: "dashboard/teachers/reassignment",
    typeImport: "TeacherReassignmentLabels",
    enImport: "dashboard/teachers/reassignment",
    enExport: "dashboardTeacherReassignmentEn",
    arExport: "dashboardTeacherReassignmentAr",
    nsPath: "dashboard/teachers/reassignment.namespace.ts",
  },
  {
    handle: "DashboardTeacherStudents",
    legacyKey: "teacherStudents",
    typePath: "dashboard/teachers/students",
    typeImport: "TeacherStudentsLabels",
    enImport: "dashboard/teachers/students",
    enExport: "dashboardTeacherStudentsEn",
    arExport: "dashboardTeacherStudentsAr",
    nsPath: "dashboard/teachers/students.namespace.ts",
  },
  {
    handle: "DashboardTeacherClassList",
    legacyKey: "teacherClassList",
    typePath: "dashboard/teachers/classList",
    typeImport: "TeacherClassListLabels",
    enImport: "dashboard/teachers/classList",
    enExport: "dashboardTeacherClassListEn",
    arExport: "dashboardTeacherClassListAr",
    nsPath: "dashboard/teachers/classList.namespace.ts",
  },
  {
    handle: "DashboardTeacherCreateRecurringClass",
    legacyKey: "teacherCreateRecurringClass",
    typePath: "dashboard/teachers/createRecurringClass",
    typeImport: "TeacherCreateRecurringClassLabels",
    enImport: "dashboard/teachers/createRecurringClass",
    enExport: "dashboardTeacherCreateRecurringClassEn",
    arExport: "dashboardTeacherCreateRecurringClassAr",
    nsPath: "dashboard/teachers/createRecurringClass.namespace.ts",
  },
  {
    handle: "DashboardTeacherFutureSchedule",
    legacyKey: "teacherFutureSchedule",
    typePath: "dashboard/teachers/futureSchedule",
    typeImport: "TeacherFutureScheduleLabels",
    enImport: "dashboard/teachers/futureSchedule",
    enExport: "dashboardTeacherFutureScheduleEn",
    arExport: "dashboardTeacherFutureScheduleAr",
    nsPath: "dashboard/teachers/futureSchedule.namespace.ts",
  },
  {
    handle: "DashboardTeacherAvailability",
    legacyKey: "teacherAvailability",
    typePath: "dashboard/teachers/availability",
    typeImport: "TeacherAvailabilityLabels",
    enImport: "dashboard/teachers/availability",
    enExport: "dashboardTeacherAvailabilityEn",
    arExport: "dashboardTeacherAvailabilityAr",
    nsPath: "dashboard/teachers/availability.namespace.ts",
  },
  {
    handle: "DashboardTeacherWeeklySchedule",
    legacyKey: "teacherWeeklySchedule",
    typePath: "dashboard/teachers/weeklySchedule",
    typeImport: "TeacherWeeklyScheduleLabels",
    enImport: "dashboard/teachers/weeklySchedule",
    enExport: "dashboardTeacherWeeklyScheduleEn",
    arExport: "dashboardTeacherWeeklyScheduleAr",
    nsPath: "dashboard/teachers/weeklySchedule.namespace.ts",
  },
  {
    handle: "DashboardStudentDirectory",
    legacyKey: "studentDirectory",
    typePath: "dashboard/students/directory",
    typeImport: "StudentDirectoryLabels",
    enImport: "dashboard/students/directory",
    enExport: "dashboardStudentDirectoryEn",
    arExport: "dashboardStudentDirectoryAr",
    nsPath: "dashboard/students/directory.namespace.ts",
  },
  {
    handle: "DashboardStudentHistory",
    legacyKey: "studentHistory",
    typePath: "dashboard/students/history",
    typeImport: "StudentHistoryLabels",
    enImport: "dashboard/students/history",
    enExport: "dashboardStudentHistoryEn",
    arExport: "dashboardStudentHistoryAr",
    nsPath: "dashboard/students/history.namespace.ts",
  },
  {
    handle: "DashboardStudentOnboarding",
    legacyKey: "studentOnboarding",
    typePath: "dashboard/students/onboarding",
    typeImport: "StudentOnboardingLabels",
    enImport: "dashboard/students/onboarding",
    enExport: "dashboardStudentOnboardingEn",
    arExport: "dashboardStudentOnboardingAr",
    nsPath: "dashboard/students/onboarding.namespace.ts",
  },
  {
    handle: "DashboardStudentProfile",
    legacyKey: "studentProfile",
    typePath: "dashboard/students/profile",
    typeImport: "StudentProfileLabels",
    enImport: "dashboard/students/profile",
    enExport: "dashboardStudentProfileEn",
    arExport: "dashboardStudentProfileAr",
    nsPath: "dashboard/students/profile.namespace.ts",
  },
  {
    handle: "DashboardStudentQuota",
    legacyKey: "studentQuota",
    typePath: "dashboard/students/quota",
    typeImport: "StudentQuotaLabels",
    enImport: "dashboard/students/quota",
    enExport: "dashboardStudentQuotaEn",
    arExport: "dashboardStudentQuotaAr",
    nsPath: "dashboard/students/quota.namespace.ts",
  },
  {
    handle: "DashboardStudentStatus",
    legacyKey: "studentStatus",
    typePath: "dashboard/students/status",
    typeImport: "StudentStatusLabels",
    enImport: "dashboard/students/status",
    enExport: "dashboardStudentStatusEn",
    arExport: "dashboardStudentStatusAr",
    nsPath: "dashboard/students/status.namespace.ts",
  },
  {
    handle: "DashboardParentsDirectory",
    legacyKey: "parentsDirectory",
    typePath: "dashboard/parents/directory",
    typeImport: "ParentsDirectoryLabels",
    enImport: "dashboard/parents/directory",
    enExport: "dashboardParentsDirectoryEn",
    arExport: "dashboardParentsDirectoryAr",
    nsPath: "dashboard/parents/directory.namespace.ts",
  },
  {
    handle: "DashboardParentOnboarding",
    legacyKey: "parentOnboarding",
    typePath: "dashboard/parents/onboarding",
    typeImport: "ParentOnboardingLabels",
    enImport: "dashboard/parents/onboarding",
    enExport: "dashboardParentOnboardingEn",
    arExport: "dashboardParentOnboardingAr",
    nsPath: "dashboard/parents/onboarding.namespace.ts",
  },
  {
    handle: "DashboardParentStudents",
    legacyKey: "parentStudents",
    typePath: "dashboard/parents/students",
    typeImport: "ParentStudentsLabels",
    enImport: "dashboard/parents/students",
    enExport: "dashboardParentStudentsEn",
    arExport: "dashboardParentStudentsAr",
    nsPath: "dashboard/parents/students.namespace.ts",
  },
  {
    handle: "DashboardParentLifecycle",
    legacyKey: "parentLifecycle",
    typePath: "dashboard/parents/lifecycle",
    typeImport: "ParentLifecycleLabels",
    enImport: "dashboard/parents/lifecycle",
    enExport: "dashboardParentLifecycleEn",
    arExport: "dashboardParentLifecycleAr",
    nsPath: "dashboard/parents/lifecycle.namespace.ts",
  },
  {
    handle: "DashboardParentProfile",
    legacyKey: "parentProfile",
    typePath: "dashboard/parents/profile",
    typeImport: "ParentProfileLabels",
    enImport: "dashboard/parents/profile",
    enExport: "dashboardParentProfileEn",
    arExport: "dashboardParentProfileAr",
    nsPath: "dashboard/parents/profile.namespace.ts",
  },
  {
    handle: "DashboardParentRules",
    legacyKey: "parentRules",
    typePath: "dashboard/parents/rules",
    typeImport: "ParentRulesLabels",
    enImport: "dashboard/parents/rules",
    enExport: "dashboardParentRulesEn",
    arExport: "dashboardParentRulesAr",
    nsPath: "dashboard/parents/rules.namespace.ts",
  },
  {
    handle: "DashboardParentSocial",
    legacyKey: "parentSocial",
    typePath: "dashboard/parents/social",
    typeImport: "ParentSocialLabels",
    enImport: "dashboard/parents/social",
    enExport: "dashboardParentSocialEn",
    arExport: "dashboardParentSocialAr",
    nsPath: "dashboard/parents/social.namespace.ts",
  },
  {
    handle: "DashboardStaffDirectory",
    legacyKey: "staffDirectory",
    typePath: "dashboard/staff/directory",
    typeImport: "StaffDirectoryLabels",
    enImport: "dashboard/staff/directory",
    enExport: "dashboardStaffDirectoryEn",
    arExport: "dashboardStaffDirectoryAr",
    nsPath: "dashboard/staff/directory.namespace.ts",
  },
  {
    handle: "DashboardStaffOnboarding",
    legacyKey: "staffOnboarding",
    typePath: "dashboard/staff/onboarding",
    typeImport: "StaffOnboardingLabels",
    enImport: "dashboard/staff/onboarding",
    enExport: "dashboardStaffOnboardingEn",
    arExport: "dashboardStaffOnboardingAr",
    nsPath: "dashboard/staff/onboarding.namespace.ts",
  },
  {
    handle: "DashboardAdmin",
    legacyKey: "admin",
    typePath: "dashboard/admin",
    typeImport: "AdminDashboardLabels",
    enImport: "dashboard/admin/index",
    enExport: "dashboardAdminEn",
    arExport: "dashboardAdminAr",
    nsPath: "dashboard/admin/main.namespace.ts",
  },
  {
    handle: "DashboardAdminView",
    legacyKey: "adminView",
    typePath: "dashboard/admin/view",
    typeImport: "AdminViewLabels",
    enImport: "dashboard/admin/view",
    enExport: "dashboardAdminViewEn",
    arExport: "dashboardAdminViewAr",
    nsPath: "dashboard/admin/view.namespace.ts",
  },
  {
    handle: "DashboardAdminDstMigration",
    legacyKey: "dstMigration",
    typePath: "dashboard/admin/dstMigration",
    typeImport: "DstMigrationLabels",
    enImport: "dashboard/admin/dstMigration",
    enExport: "dashboardDstMigrationEn",
    arExport: "dashboardDstMigrationAr",
    nsPath: "dashboard/admin/dstMigration.namespace.ts",
  },
  {
    handle: "DashboardSupervisorPortalDashboard",
    legacyKey: "supervisorPortalDashboard",
    typePath: "dashboard/supervisorPortal/supervisorDashboard",
    typeImport: "SupervisorDashboardLabels",
    enImport: "dashboard/supervisorPortal/supervisorDashboard",
    enExport: "dashboardSupervisorPortalDashboardEn",
    arExport: "dashboardSupervisorPortalDashboardAr",
    nsPath: "dashboard/supervisorPortal/dashboard.namespace.ts",
  },
  {
    handle: "DashboardSupervisorPortalMonthlyReports",
    legacyKey: "supervisorPortalMonthlyReports",
    typePath: "dashboard/supervisorPortal/monthlyReports",
    typeImport: "SupervisorMonthlyReportsLabels",
    enImport: "dashboard/supervisorPortal/monthlyReports",
    enExport: "dashboardSupervisorPortalMonthlyReportsEn",
    arExport: "dashboardSupervisorPortalMonthlyReportsAr",
    nsPath: "dashboard/supervisorPortal/monthlyReports.namespace.ts",
  },
  {
    handle: "DashboardSupervisorPortalPendingReviews",
    legacyKey: "supervisorPortalPendingReviews",
    typePath: "dashboard/supervisorPortal/pendingReviews",
    typeImport: "PendingReviewsLabels",
    enImport: "dashboard/supervisorPortal/pendingReviews",
    enExport: "dashboardSupervisorPortalPendingReviewsEn",
    arExport: "dashboardSupervisorPortalPendingReviewsAr",
    nsPath: "dashboard/supervisorPortal/pendingReviews.namespace.ts",
  },
  {
    handle: "DashboardSupervisorPortalProfile",
    legacyKey: "supervisorPortalProfile",
    typePath: "dashboard/supervisorPortal/profile",
    typeImport: "SupervisorPortalProfileLabels",
    enImport: "dashboard/supervisorPortal/profile",
    enExport: "dashboardSupervisorPortalProfileEn",
    arExport: "dashboardSupervisorPortalProfileAr",
    nsPath: "dashboard/supervisorPortal/profile.namespace.ts",
  },
  {
    handle: "DashboardSupervisorPortalTeacherDues",
    legacyKey: "supervisorPortalTeacherDues",
    typePath: "dashboard/supervisorPortal/teacherDues",
    typeImport: "SupervisorTeacherDuesLabels",
    enImport: "dashboard/supervisorPortal/teacherDues",
    enExport: "dashboardSupervisorPortalTeacherDuesEn",
    arExport: "dashboardSupervisorPortalTeacherDuesAr",
    nsPath: "dashboard/supervisorPortal/teacherDues.namespace.ts",
  },
  {
    handle: "DashboardStudentPortalDashboard",
    legacyKey: "studentPortalDashboard",
    typePath: "dashboard/studentPortal/studentDashboard",
    typeImport: "StudentPortalDashboardLabels",
    enImport: "dashboard/studentPortal/studentDashboard",
    enExport: "dashboardStudentPortalDashboardEn",
    arExport: "dashboardStudentPortalDashboardAr",
    nsPath: "dashboard/studentPortal/dashboard.namespace.ts",
  },
  {
    handle: "DashboardStudentPortalCredits",
    legacyKey: "studentPortalCredits",
    typePath: "dashboard/studentPortal/studentCredits",
    typeImport: "StudentPortalCreditsLabels",
    enImport: "dashboard/studentPortal/studentCredits",
    enExport: "dashboardStudentPortalCreditsEn",
    arExport: "dashboardStudentPortalCreditsAr",
    nsPath: "dashboard/studentPortal/credits.namespace.ts",
  },
  {
    handle: "DashboardStudentPortalHistory",
    legacyKey: "studentPortalHistory",
    typePath: "dashboard/studentPortal/studentHistory",
    typeImport: "StudentPortalHistoryLabels",
    enImport: "dashboard/studentPortal/studentHistory",
    enExport: "dashboardStudentPortalHistoryEn",
    arExport: "dashboardStudentPortalHistoryAr",
    nsPath: "dashboard/studentPortal/history.namespace.ts",
  },
  {
    handle: "DashboardStudentPortalProfile",
    legacyKey: "studentPortalProfile",
    typePath: "dashboard/studentPortal/studentProfile",
    typeImport: "StudentPortalProfileLabels",
    enImport: "dashboard/studentPortal/studentProfile",
    enExport: "dashboardStudentPortalProfileEn",
    arExport: "dashboardStudentPortalProfileAr",
    nsPath: "dashboard/studentPortal/profile.namespace.ts",
  },
  {
    handle: "DashboardLmsCredit",
    legacyKey: "lmsCredit",
    typePath: "dashboard/lms/credit",
    typeImport: "CreditLabels",
    enImport: "dashboard/lms/credit",
    enExport: "dashboardLmsCreditEn",
    arExport: "dashboardLmsCreditAr",
    nsPath: "dashboard/lms/credit.namespace.ts",
  },
  {
    handle: "DashboardLmsLessonReports",
    legacyKey: "lmsLessonReports",
    typePath: "dashboard/lms/lessonReports",
    typeImport: "LessonReportLabels",
    enImport: "dashboard/lms/lessonReports",
    enExport: "dashboardLmsLessonReportsEn",
    arExport: "dashboardLmsLessonReportsAr",
    nsPath: "dashboard/lms/lessonReports.namespace.ts",
  },
  {
    handle: "DashboardLmsMonthlyReports",
    legacyKey: "lmsMonthlyReports",
    typePath: "dashboard/lms/monthlyReports",
    typeImport: "MonthlyReportLabels",
    enImport: "dashboard/lms/monthlyReports",
    enExport: "dashboardLmsMonthlyReportsEn",
    arExport: "dashboardLmsMonthlyReportsAr",
    nsPath: "dashboard/lms/monthlyReports.namespace.ts",
  },
  {
    handle: "DashboardLmsTeacherDues",
    legacyKey: "lmsTeacherDues",
    typePath: "dashboard/lms/teacherDues",
    typeImport: "TeacherDueLabels",
    enImport: "dashboard/lms/teacherDues",
    enExport: "dashboardLmsTeacherDuesEn",
    arExport: "dashboardLmsTeacherDuesAr",
    nsPath: "dashboard/lms/teacherDues.namespace.ts",
  },
  {
    handle: "DashboardPermissions",
    legacyKey: "permissions",
    typePath: "dashboard/permissions/main",
    typeImport: "PermissionsLabels",
    enImport: "dashboard/permissions/main",
    enExport: "dashboardPermissionsEn",
    arExport: "dashboardPermissionsAr",
    nsPath: "dashboard/permissions/main.namespace.ts",
  },
  {
    handle: "DashboardComplaints",
    legacyKey: "complaints",
    typePath: "dashboard/complaints",
    typeImport: "ComplaintsLabels",
    enImport: "dashboard/complaints/main",
    enExport: "dashboardComplaintsEn",
    arExport: "dashboardComplaintsAr",
    nsPath: "dashboard/complaints/main.namespace.ts",
  },
  {
    handle: "DashboardSuggestions",
    legacyKey: "suggestions",
    typePath: "dashboard/suggestions",
    typeImport: "SuggestionsLabels",
    enImport: "dashboard/suggestions/main",
    enExport: "dashboardSuggestionsEn",
    arExport: "dashboardSuggestionsAr",
    nsPath: "dashboard/suggestions/main.namespace.ts",
  },
  {
    handle: "DashboardReports",
    legacyKey: "reports",
    typePath: "dashboard/reports/main",
    typeImport: "ReportsLabels",
    enImport: "dashboard/reports/main",
    enExport: "dashboardReportsEn",
    arExport: "dashboardReportsAr",
    nsPath: "dashboard/reports/main.namespace.ts",
  },
  {
    handle: "DashboardResources",
    legacyKey: "resources",
    typePath: "dashboard/resources",
    typeImport: "ResourcesLabels",
    enImport: "dashboard/resources/main",
    enExport: "dashboardResourcesEn",
    arExport: "dashboardResourcesAr",
    nsPath: "dashboard/resources/main.namespace.ts",
  },
  {
    handle: "DashboardBooksAndBags",
    legacyKey: "booksAndBags",
    typePath: "dashboard/resources",
    typeImport: "BooksAndBagsLabels",
    enImport: "dashboard/resources/booksAndBags",
    enExport: "dashboardBooksAndBagsEn",
    arExport: "dashboardBooksAndBagsAr",
    nsPath: "dashboard/resources/booksAndBags.namespace.ts",
  },
  {
    handle: "DashboardSubjects",
    legacyKey: "subjects",
    typePath: "dashboard/subjects/main",
    typeImport: "SubjectsLabels",
    enImport: "dashboard/subjects/main",
    enExport: "dashboardSubjectsEn",
    arExport: "dashboardSubjectsAr",
    nsPath: "dashboard/subjects/main.namespace.ts",
  },
  {
    handle: "DashboardMeetingProviders",
    legacyKey: "meetingProviders",
    typePath: "dashboard/meeting-providers/main",
    typeImport: "MeetingProvidersLabels",
    enImport: "dashboard/meeting-providers/main",
    enExport: "dashboardMeetingProvidersEn",
    arExport: "dashboardMeetingProvidersAr",
    nsPath: "dashboard/meeting-providers/main.namespace.ts",
  },
  {
    handle: "DashboardPaymentCatalogs",
    legacyKey: "paymentCatalogs",
    typePath: "dashboard/payment-catalogs/main",
    typeImport: "PaymentCatalogsLabels",
    enImport: "dashboard/payment-catalogs/main",
    enExport: "dashboardPaymentCatalogsEn",
    arExport: "dashboardPaymentCatalogsAr",
    nsPath: "dashboard/payment-catalogs/main.namespace.ts",
  },
];

function handleToTranslationPath(handle: string): string {
  const shortName = handle.replace(/^Dashboard/, "");
  return `Translation.Dashboard.${shortName}`;
}

function generateNamespaceFile(ns: NamespaceDef): string {
  return `import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ${ns.typeImport} } from "@/shared/locale/types/${ns.typePath}";

export const ${ns.handle} = defineNamespace<${ns.typeImport}>({
  load: {
    en: () => import("@/shared/locale/en/${ns.enImport}").then(module => module.${ns.enExport}),
    ar: () => import("@/shared/locale/ar/${ns.enImport}").then(module => module.${ns.arExport}),
  },
});
`;
}

const legacyToHandle = new Map<string, string>();
for (const ns of namespaces) {
  legacyToHandle.set(ns.legacyKey, ns.handle);
}
legacyToHandle.set("settings.audit", "DashboardSettings");

const sortedLegacyKeys = [...legacyToHandle.keys()].sort((a, b) => b.length - a.length);

function ensureTranslationImport(content: string): string {
  if (!content.includes("Translation.Dashboard.")) return content;
  if (/import\s*\{[^}]*\bTranslation\b/.test(content)) return content;

  const localeImport = /import\s*\{([^}]+)\}\s*from\s*"@\/shared\/locale";?/;
  const match = content.match(localeImport);
  if (match) {
    const imports = match[1].trim();
    const newImports = imports.includes("Translation") ? imports : `${imports}, Translation`;
    return content.replace(localeImport, `import { ${newImports} } from "@/shared/locale";`);
  }

  const clientImport = /import\s*\{([^}]+)\}\s*from\s*"@\/shared\/locale\/client";?/;
  const clientMatch = content.match(clientImport);
  if (clientMatch) {
    const imports = clientMatch[1].trim();
    const newImports = imports.includes("Translation") ? imports : `${imports}, Translation`;
    return content.replace(clientImport, `import { ${newImports} } from "@/shared/locale/client";`);
  }

  if (content.startsWith('"use client";')) {
    return content.replace(
      /^"use client";\n/,
      `"use client";\n\nimport { Translation, useAppTranslation } from "@/shared/locale";\n`
    );
  }

  return `import { Translation } from "@/shared/locale";\n${content}`;
}

function migrateFileContent(content: string): { content: string; changed: boolean } {
  let result = content;
  let changed = false;

  for (const legacyKey of sortedLegacyKeys) {
    const handle = legacyToHandle.get(legacyKey);
    if (!handle) {
      continue;
    }
    const fullPath = handleToTranslationPath(handle);
    const escaped = legacyKey.replace(/\./g, "\\.");

    const p1 = new RegExp(`useAppTranslation\\(\\)\\.dashboardTranslations\\.${escaped}((?:\\.\\w+)*)`, "g");
    const c1 = result.replace(p1, `useAppTranslation(${fullPath})$1`);
    if (c1 !== result) {
      result = c1;
      changed = true;
    }

    const p2 = new RegExp(`\\.dashboardTranslations\\.${escaped}((?:\\.\\w+)*)`, "g");
    const c2 = result.replace(p2, (_m, suffix: string) => `__MIGRATE_${handle}__${suffix}`);
    if (c2 !== result) {
      result = c2;
      changed = true;
    }
  }

  const migrateMarker = /__MIGRATE_(Dashboard\w+)__((?:\.\w+)*)/g;
  const c3 = result.replace(migrateMarker, (_m, handle: string, suffix: string) => {
    const fullPath = handleToTranslationPath(handle);
    return `useAppTranslation(${fullPath})${suffix}`;
  });
  if (c3 !== result) {
    result = c3;
    changed = true;
  }

  if (changed) {
    result = ensureTranslationImport(result);
  }

  return { content: result, changed };
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...walkDir(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

for (const ns of namespaces) {
  const fullPath = join(ROOT, "shared/locale/namespaces", ns.nsPath);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, generateNamespaceFile(ns));
}
console.log(`Created ${namespaces.length} namespace files`);

let migratedFiles = 0;
for (const dir of [join(ROOT, "frontend"), join(ROOT, "app")]) {
  for (const file of walkDir(dir)) {
    const content = readFileSync(file, "utf-8");
    if (!content.includes("dashboardTranslations.")) continue;
    const { content: newContent, changed } = migrateFileContent(content);
    if (changed) {
      writeFileSync(file, newContent);
      migratedFiles++;
    }
  }
}
console.log(`Migrated ${migratedFiles} call-site files`);

const indexPath = join(ROOT, "shared/locale/namespaces/index.ts");
let indexContent = readFileSync(indexPath, "utf-8");
for (const ns of namespaces) {
  const importLine = `export { ${ns.handle} } from "@/shared/locale/namespaces/${ns.nsPath.replace(/\.ts$/, "")}";`;
  if (!indexContent.includes(ns.handle)) {
    indexContent = indexContent.replace(/export \{\s*defineNamespace,/, `${importLine}\nexport {\n  defineNamespace,`);
  }
}
writeFileSync(indexPath, indexContent);
console.log("Updated namespaces/index.ts");

const translationPath = join(ROOT, "shared/locale/namespaces/translation.ts");
let translationContent = readFileSync(translationPath, "utf-8");
for (const ns of namespaces) {
  const shortName = ns.handle.replace(/^Dashboard/, "");
  const importLine = `import { ${ns.handle} } from "@/shared/locale/namespaces/${ns.nsPath.replace(/\.ts$/, "")}";`;
  if (!translationContent.includes(ns.handle)) {
    translationContent = translationContent.replace(
      /export const Translation = \{/,
      `${importLine}\nexport const Translation = {`
    );
    translationContent = translationContent.replace(
      /CoreParentDashboard: DashboardCoreParentDashboard,\n {2}\},/,
      `CoreParentDashboard: DashboardCoreParentDashboard,\n    ${shortName}: ${ns.handle},\n  },`
    );
  }
}
writeFileSync(translationPath, translationContent);
console.log("Updated translation.ts");
