import type { SessionLabels } from "../types/session";
import { auth } from "./auth";
import { common } from "./common";
import { admin, dstMigration } from "./dashboard/admin";
import { billing as billingLabels } from "./dashboard/billing";
import {
  classAudit,
  classDetails,
  createRecurringClass,
  rescheduleForm,
  rescheduleTracking,
} from "./dashboard/classes";
import { complaints as complaintsLabels } from "./dashboard/complaints";
import {
  layout,
  nav,
  notifications,
  parentDashboard,
  scheduleAlerts,
  searchSchedule,
  statusTracking,
} from "./dashboard/core";
import { managerOnboarding, managersDirectory } from "./dashboard/managers";
import { directory, onboarding, profile } from "./dashboard/parents";
import { permissions as permissionsLabels } from "./dashboard/permissions";
import { reports as reportsLabels } from "./dashboard/reports";
import { booksAndBags as booksAndBagsLabels, resources as resourcesLabels } from "./dashboard/resources";
import {
  directory as studentDirectory,
  history as studentHistory,
  quota as studentQuota,
  status as studentStatus,
} from "./dashboard/students";
import { subjects as subjectsLabels } from "./dashboard/subjects";
import { suggestions as suggestionsLabels } from "./dashboard/suggestions";
import {
  availability as teacherAvailability,
  teacherCreateRecurringClass,
  dashboard as teacherDashboard,
  classList as teacherClassList,
  ownProfile as teacherOwnProfile,
  students as teacherStudents,
  futureSchedule as teacherFutureSchedule,
  onboarding as teacherOnboarding,
  profile as teacherProfile,
  reassignment as teacherReassignment,
  directory as teachersDirectory,
  weeklySchedule as teacherWeeklySchedule,
} from "./dashboard/teachers";
import { errors } from "./errors";

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
  session,
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
    booksAndBags: booksAndBagsLabels,
    permissions: permissionsLabels,
    searchSchedule,
  },
};

export default arTranslations;
