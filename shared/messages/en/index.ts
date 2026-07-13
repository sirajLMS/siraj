import { auth } from "@/shared/messages/en/auth";
import { common } from "@/shared/messages/en/common";
import { admin, dstMigration } from "@/shared/messages/en/dashboard/admin";
import { billing } from "@/shared/messages/en/dashboard/billing";
import {
  classAudit,
  classDetails,
  createRecurringClass,
  rescheduleForm,
  rescheduleTracking,
} from "@/shared/messages/en/dashboard/classes";
import { complaints } from "@/shared/messages/en/dashboard/complaints";
import {
  layout,
  nav,
  notifications,
  parentDashboard,
  scheduleAlerts,
  searchSchedule,
  statusTracking,
} from "@/shared/messages/en/dashboard/core";
import {
  credit as lmsCredit,
  lessonReports as lmsLessonReports,
  monthlyReports as lmsMonthlyReports,
  teacherDues as lmsTeacherDues,
} from "@/shared/messages/en/dashboard/lms";
import { managerOnboarding, managersDirectory } from "@/shared/messages/en/dashboard/managers";
import { meetingProviders } from "@/shared/messages/en/dashboard/meeting-providers";
import {
  directory,
  onboarding,
  lifecycle as parentLifecycle,
  profile as parentProfile,
  parentRules,
  parentSocial,
  parentStudents,
} from "@/shared/messages/en/dashboard/parents";
import { paymentCatalogs } from "@/shared/messages/en/dashboard/payment-catalogs";
import { permissions } from "@/shared/messages/en/dashboard/permissions";
import { reports } from "@/shared/messages/en/dashboard/reports";
import { booksAndBags, resources } from "@/shared/messages/en/dashboard/resources";
import {
  studentCredits as spStudentCredits,
  studentDashboard as spStudentDashboard,
} from "@/shared/messages/en/dashboard/studentPortal";
import {
  directory as studentDirectory,
  history as studentHistory,
  onboarding as studentOnboarding,
  profile as studentProfile,
  quota as studentQuota,
  status as studentStatus,
} from "@/shared/messages/en/dashboard/students";
import { subjects } from "@/shared/messages/en/dashboard/subjects";
import { suggestions } from "@/shared/messages/en/dashboard/suggestions";
import {
  supervisorDashboard as supDashboard,
  supervisorMonthlyReports as supMonthlyReports,
  pendingReviews as supPendingReviews,
  supervisorTeacherDues as supTeacherDues,
} from "@/shared/messages/en/dashboard/supervisorPortal";
import {
  classList,
  futureSchedule,
  ownProfile,
  availability as teacherAvailability,
  createRecurringClass as teacherCreateRecurringClass,
  dashboard as teacherDashboard,
  onboarding as teacherOnboarding,
  profile as teacherProfile,
  reassignment as teacherReassignment,
  students as teacherStudents,
  directory as teachersDirectory,
  weeklySchedule,
} from "@/shared/messages/en/dashboard/teachers";
import { errors } from "@/shared/messages/en/errors";
import { profile } from "@/shared/messages/en/profile";
import {
  catalogImageUpload,
  countrySelect,
  currencySelect,
  genderSelector,
  languageSelector,
  localizedString,
  meetingConfig,
  paymentMethod,
  phoneInput,
  tagInput,
  timezoneSelect,
} from "@/shared/messages/en/ui";
import type { SessionLabels } from "@/shared/messages/types/session";

export const session: SessionLabels = {
  leaveProcessedDescription: "Leave request processed, rescheduled to session {successorId}.",
  absentWaitingRemark: "Waited through the entire class time.",
  leaveRescheduledRemark: "Leave approved - session rescheduled.",
  resetDescription: "Session reset by admin.",
  absentEventDescription: "Student absence marked after waiting period.",
  autoMissedEventDescription: "Class automatically marked as missed after the activation grace period.",
  manualRescheduleDescription: "Class manually rescheduled to {newStart} by admin.",
  manualRescheduleRemark: "Reschedule: moved from {oldStart} to {newStart}.",
  activateDescription: "Activated",
  forceActivateDescription: "Force activated",
  startDescription: "Start class",
  stopDescription: "Manual stop",
  softDeleteDescription: "Soft delete",
  teacherQuotaExhaustedNote: "[Manager reschedule] Teacher exhausted monthly leave quota ({used}/{max}).",
  classTypes: {
    REGULAR: "Regular Class",
    TRIAL: "Trial Class",
    ADVANCE: "Advance Class",
  },
};

export const enTranslations = {
  common,
  auth,
  errors,
  profile,
  session,
  ui: {
    catalogImageUpload,
    genderSelector,
    countrySelect,
    currencySelect,
    languageSelector,
    localizedString,
    phoneInput,
    tagInput,
    timezoneSelect,
    meetingConfig,
    paymentMethod,
  },
  dashboard: {
    nav,
    layout,
    notifications,
    statusTracking,
    teacherProfile,
    teachersDirectory,
    studentStatus,
    studentQuota,
    studentProfile,
    studentHistory,
    studentDirectory,
    studentOnboarding,
    rescheduleTracking,
    scheduleAlerts,
    admin,
    dstMigration,
    classDetails,
    classAudit,
    createRecurringClass,
    teacherCreateRecurringClass,
    teacherAvailability,
    teacherWeeklySchedule: weeklySchedule,
    teacherFutureSchedule: futureSchedule,
    teacherReassignment,
    teacherOnboarding,
    teacherDashboard,
    teacherStudents,
    teacherOwnProfile: ownProfile,
    teacherClassList: classList,
    parentsDirectory: directory,
    parentLifecycle,
    parentProfile,
    managersDirectory,
    parentOnboarding: onboarding,
    parentStudents,
    parentSocial,
    parentRules,
    managerOnboarding,
    rescheduleForm,
    parentDashboard,
    reports,
    billing,
    suggestions,
    complaints,
    resources,
    subjects,
    meetingProviders,
    paymentCatalogs,
    booksAndBags,
    permissions,
    searchSchedule,
    lms: {
      credit: lmsCredit,
      lessonReports: lmsLessonReports,
      teacherDues: lmsTeacherDues,
      monthlyReports: lmsMonthlyReports,
    },
    studentPortal: {
      dashboard: spStudentDashboard,
      credits: spStudentCredits,
    },
    supervisorPortal: {
      dashboard: supDashboard,
      pendingReviews: supPendingReviews,
      teacherDues: supTeacherDues,
      monthlyReports: supMonthlyReports,
    },
  },
};

export default enTranslations;
