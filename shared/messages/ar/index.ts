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
import { layout, nav, parentDashboard, scheduleAlerts, statusTracking } from "./dashboard/core";
import { managerOnboarding, managersDirectory } from "./dashboard/managers";
import { directory, onboarding, profile } from "./dashboard/parents";
import { reports as reportsLabels } from "./dashboard/reports";
import { resources as resourcesLabels } from "./dashboard/resources";
import {
  directory as studentDirectory,
  history as studentHistory,
  quota as studentQuota,
  status as studentStatus,
} from "./dashboard/students";
import { suggestions as suggestionsLabels } from "./dashboard/suggestions";
import {
  availability as teacherAvailability,
  dashboard as teacherDashboard,
  futureSchedule as teacherFutureSchedule,
  onboarding as teacherOnboarding,
  profile as teacherProfile,
  reassignment as teacherReassignment,
  directory as teachersDirectory,
  weeklySchedule as teacherWeeklySchedule,
} from "./dashboard/teachers";
import { errors } from "./errors";

export const arTranslations = {
  common,
  auth,
  errors,
  dashboard: {
    nav,
    layout,
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
    teacherAvailability,
    teacherWeeklySchedule,
    teacherFutureSchedule,
    teacherReassignment,
    teacherOnboarding,
    teacherDashboard,
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
  },
};
