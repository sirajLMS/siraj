import { auth } from "@/shared/messages/ar/auth";
import { common } from "@/shared/messages/ar/common";
import { admin, dstMigration } from "@/shared/messages/ar/dashboard/admin";
import { billing as billingLabels } from "@/shared/messages/ar/dashboard/billing";
import {
  classAudit,
  classDetails,
  createRecurringClass,
  rescheduleForm,
  rescheduleTracking,
} from "@/shared/messages/ar/dashboard/classes";
import { complaints as complaintsLabels } from "@/shared/messages/ar/dashboard/complaints";
import {
  layout,
  nav,
  notifications,
  parentDashboard,
  scheduleAlerts,
  searchSchedule,
  statusTracking,
} from "@/shared/messages/ar/dashboard/core";
import { managerOnboarding, managersDirectory } from "@/shared/messages/ar/dashboard/managers";
import { meetingProviders as meetingProvidersLabels } from "@/shared/messages/ar/dashboard/meeting-providers/main";
import {
  directory,
  onboarding,
  parentRules,
  parentSocial,
  parentStudents,
  profile,
} from "@/shared/messages/ar/dashboard/parents";
import { paymentCatalogs as paymentCatalogsLabels } from "@/shared/messages/ar/dashboard/payment-catalogs/main";
import { permissions as permissionsLabels } from "@/shared/messages/ar/dashboard/permissions";
import { reports as reportsLabels } from "@/shared/messages/ar/dashboard/reports";
import {
  booksAndBags as booksAndBagsLabels,
  resources as resourcesLabels,
} from "@/shared/messages/ar/dashboard/resources";
import {
  directory as studentDirectory,
  history as studentHistory,
  onboarding as studentOnboarding,
  quota as studentQuota,
  status as studentStatus,
} from "@/shared/messages/ar/dashboard/students";
import { subjects as subjectsLabels } from "@/shared/messages/ar/dashboard/subjects";
import { suggestions as suggestionsLabels } from "@/shared/messages/ar/dashboard/suggestions";
import {
  availability as teacherAvailability,
  classList as teacherClassList,
  teacherCreateRecurringClass,
  dashboard as teacherDashboard,
  futureSchedule as teacherFutureSchedule,
  onboarding as teacherOnboarding,
  ownProfile as teacherOwnProfile,
  profile as teacherProfile,
  reassignment as teacherReassignment,
  students as teacherStudents,
  directory as teachersDirectory,
  weeklySchedule as teacherWeeklySchedule,
} from "@/shared/messages/ar/dashboard/teachers";
import { errors } from "@/shared/messages/ar/errors";
import { profile as profileLabels } from "@/shared/messages/ar/profile";
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
} from "@/shared/messages/ar/ui";
import type { SessionLabels } from "@/shared/messages/types/session";

export const session: SessionLabels = {
  leaveProcessedDescription: "تمت معالجة طلب الإجازة، أعيدت جدولته إلى الجلسة {successorId}.",
  absentWaitingRemark: "لقد انتظرت طوال وقت الحصة.",
  leaveRescheduledRemark: "تمت الموافقة على الإجازة - تم إعادة جدولة الجلسة.",
  resetDescription: "تم إعادة تعيين الجلسة من قبل المسؤول.",
  absentEventDescription: "تم تسجيل غياب الطالب بعد فترة الانتظار.",
  autoMissedEventDescription: "تم تسجيل الحصة كفائتة تلقائياً بعد انتهاء فترة السماح للتفعيل.",
  manualRescheduleDescription: "تم إعادة جدولة الحصة يدويًا إلى {newStart} بواسطة المسؤول.",
  manualRescheduleRemark: "إعادة جدولة: نقل من {oldStart} إلى {newStart}.",
  activateDescription: "تم التفعيل",
  forceActivateDescription: "تفعيل قسري",
  startDescription: "بدء الحصة",
  stopDescription: "إيقاف يدوي",
  softDeleteDescription: "حذف مؤقت",
  teacherQuotaExhaustedNote: "[إعادة جدولة من المدير] المعلم استنفد حد الإجازات الشهري ({used}/{max}).",
  classTypes: {
    REGULAR: "حصة عادية",
    TRIAL: "حصة تجريبية",
    ADVANCE: "حصة متقدمة",
  },
};

export const arTranslations = {
  common,
  auth,
  errors,
  profile: profileLabels,
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
    studentHistory,
    studentDirectory,
    studentOnboarding,
    rescheduleTracking,
    scheduleAlerts,
    admin,
    classDetails,
    classAudit,
    createRecurringClass,
    teacherCreateRecurringClass,
    teacherAvailability,
    teacherWeeklySchedule,
    teacherFutureSchedule,
    teacherReassignment,
    teacherOnboarding,
    teacherDashboard,
    teacherStudents,
    teacherOwnProfile,
    teacherClassList,
    parentsDirectory: directory,
    parentProfile: profile,
    managersDirectory,
    parentOnboarding: onboarding,
    parentStudents,
    parentSocial,
    parentRules,
    managerOnboarding,
    rescheduleForm,
    dstMigration,
    parentDashboard,
    reports: reportsLabels,
    billing: billingLabels,
    suggestions: suggestionsLabels,
    complaints: complaintsLabels,
    resources: resourcesLabels,
    subjects: subjectsLabels,
    meetingProviders: meetingProvidersLabels,
    paymentCatalogs: paymentCatalogsLabels,
    booksAndBags: booksAndBagsLabels,
    permissions: permissionsLabels,
    searchSchedule,
  },
};

export default arTranslations;
