import type { useTranslations } from "next-intl";
import { buildClassInstanceStatusLabels } from "@/frontend/views/dashboard/utils/classInstanceStatusLabels";
import type { TeacherDashboardLabels, TeacherDashboardViewLabels } from "../types/teacherDashboardLabels";

type TeacherDashboardTranslator = ReturnType<typeof useTranslations<"dashboard.teacherDashboard">>;
type DashboardTranslator = ReturnType<typeof useTranslations<"dashboard">>;

function buildMetricsLabels(t: TeacherDashboardTranslator): TeacherDashboardViewLabels["metrics"] {
  return {
    totalClasses: t("metrics.totalClasses"),
    missedSlots: t("metrics.missedSlots"),
    completed: t("metrics.completed"),
    studentsToday: t("metrics.studentsToday"),
  };
}

function buildActiveMetricsLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["activeMetrics"] {
  return {
    totalClasses: t("activeMetrics.totalClasses"),
    activeSessions: t("activeMetrics.activeSessions"),
    missedSlots: t("activeMetrics.missedSlots"),
    completed: t("activeMetrics.completed"),
  };
}

function buildScheduleLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["schedule"] {
  return {
    title: t("schedule.title"),
    titleToday: t("schedule.titleToday"),
    rowNumber: t("schedule.rowNumber"),
    classId: t("schedule.classId"),
    student: t("schedule.student"),
    time: t("schedule.time"),
    status: t("schedule.status"),
    contact: t("schedule.contact"),
    actions: t("schedule.actions"),
    showing: t.raw("schedule.showing") as string,
    noEntries: t("schedule.noEntries"),
    sessionEnded: t("schedule.sessionEnded"),
    duration: t("schedule.duration"),
    durationValue: t.raw("schedule.durationValue") as string,
    current: t("schedule.current"),
    viewAll: t("schedule.viewAll"),
  };
}

function buildStatusLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["status"] {
  return {
    missed: t("status.missed"),
    pending: t("status.pending"),
    upcoming: t("status.upcoming"),
    completed: t("status.completed"),
    active: t("status.active"),
    connecting: t("status.connecting"),
    activated: t("status.activated"),
  };
}

function buildActionLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["actions"] {
  return {
    activate: t("actions.activate"),
    activateSession: t("actions.activateSession"),
    connecting: t("actions.connecting"),
    printSchedule: t("actions.printSchedule"),
    manualEntry: t("actions.manualEntry"),
    newSession: t("actions.newSession"),
    joinVideo: t("actions.joinVideo"),
    downloadHandbook: t("actions.downloadHandbook"),
    contactCoordinator: t("actions.contactCoordinator"),
    disabledTooltips: {
      activateBeforeWindow: t("actions.disabledTooltips.activateBeforeWindow"),
      activateAfterWindow: t("actions.disabledTooltips.activateAfterWindow"),
      activateConnecting: t("actions.disabledTooltips.activateConnecting"),
      joinVideoUnavailable: t("actions.disabledTooltips.joinVideoUnavailable"),
      markAbsentWaitingPeriod: t("actions.disabledTooltips.markAbsentWaitingPeriod"),
    },
  };
}

function buildActiveWelcomeLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["activeWelcome"] {
  return {
    title: t.raw("activeWelcome.title") as string,
    subtitle: t.raw("activeWelcome.subtitle") as string,
    overviewLabel: t("activeWelcome.overviewLabel"),
    mobileSummary: t.raw("activeWelcome.mobileSummary") as string,
  };
}

function buildActiveControlsLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["activeControls"] {
  return {
    liveNow: t("activeControls.liveNow"),
    sessionControls: t("activeControls.sessionControls"),
    startSession: t("activeControls.startSession"),
    markAbsent: t("activeControls.markAbsent"),
    requestLeave: t("activeControls.requestLeave"),
    markAbsentDialogTitle: t("activeControls.markAbsentDialogTitle"),
    markAbsentConfirmation: t("activeControls.markAbsentConfirmation"),
    markAbsentConfirm: t("activeControls.markAbsentConfirm"),
    cancel: t("activeControls.cancel"),
  };
}

function buildProgressFeedLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["progressFeed"] {
  return {
    title: t("progressFeed.title"),
  };
}

function buildAlertLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["alert"] {
  return {
    title: t("alert.title"),
    description: t.raw("alert.description") as string,
  };
}

function buildPolicyLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["policy"] {
  return {
    title: t("policy.title"),
    description: t("policy.description"),
    descriptionMobile: t("policy.descriptionMobile"),
  };
}

function buildDateFilterLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["dateFilter"] {
  return {
    today: t("dateFilter.today"),
    previousDay: t("dateFilter.previousDay"),
    nextDay: t("dateFilter.nextDay"),
    dateLabel: t("dateFilter.dateLabel"),
  };
}

function buildSupportLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["support"] {
  return {
    liveSupport: t("support.liveSupport"),
  };
}

function buildErrorLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["errors"] {
  return {
    meetingUrlNotAvailable: t("errors.meetingUrlNotAvailable"),
    handbookUrlNotFound: t("errors.handbookUrlNotFound"),
    missedClassTime: t("errors.missedClassTime"),
    activationFailed: t("errors.activationFailed"),
  };
}

function buildManualClassEntryLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["manualClassEntry"] {
  return {
    titleCreate: t("manualClassEntry.titleCreate"),
    titleCreateActive: t("manualClassEntry.titleCreateActive"),
    cancel: t("manualClassEntry.cancel"),
    create: t("manualClassEntry.create"),
    creating: t("manualClassEntry.creating"),
    studentLabel: t("manualClassEntry.studentLabel"),
    studentLoading: t("manualClassEntry.studentLoading"),
    noStudentsAssigned: t("manualClassEntry.noStudentsAssigned"),
    scheduledDate: t("manualClassEntry.scheduledDate"),
    startTime: t("manualClassEntry.startTime"),
    durationMinutes: t("manualClassEntry.durationMinutes"),
    classType: t("manualClassEntry.classType"),
    classTypeRegular: t("manualClassEntry.classTypeRegular"),
    classTypeTrial: t("manualClassEntry.classTypeTrial"),
    classTypePromotion: t("manualClassEntry.classTypePromotion"),
    selectStudent: t("manualClassEntry.selectStudent"),
    selectDate: t("manualClassEntry.selectDate"),
    selectTime: t("manualClassEntry.selectTime"),
    createFailed: t("manualClassEntry.createFailed"),
    teacherIdNotFound: t("manualClassEntry.teacherIdNotFound"),
  };
}

export function buildTeacherDashboardLabels(
  t: TeacherDashboardTranslator,
  dashboardT: DashboardTranslator
): TeacherDashboardViewLabels {
  const instanceStatusLabels = buildClassInstanceStatusLabels(dashboardT);

  return {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    overviewTitle: t("overviewTitle"),
    todayChip: t("todayChip"),
    metrics: buildMetricsLabels(t),
    activeMetrics: buildActiveMetricsLabels(t),
    activeWelcome: buildActiveWelcomeLabels(t),
    schedule: buildScheduleLabels(t),
    status: buildStatusLabels(t),
    actions: buildActionLabels(t),
    activeControls: buildActiveControlsLabels(t),
    progressFeed: buildProgressFeedLabels(t),
    alert: buildAlertLabels(t),
    policy: buildPolicyLabels(t),
    dateFilter: buildDateFilterLabels(t),
    support: buildSupportLabels(t),
    errors: buildErrorLabels(t),
    manualClassEntry: buildManualClassEntryLabels(t),
    supportRequestSubmitted: t.raw("supportRequestSubmitted") as string,
    rules: {
      pageTitle: t("rules.pageTitle"),
      pageSubtitle: t("rules.pageSubtitle"),
    },
    instanceStatusLabels,
  };
}
