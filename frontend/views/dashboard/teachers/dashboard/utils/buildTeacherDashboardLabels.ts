import type { useTranslations } from "next-intl";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";

type TeacherDashboardTranslator = ReturnType<typeof useTranslations<"dashboard.teacherDashboard">>;

function buildMetricsLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["metrics"] {
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
  };
}

export function buildTeacherDashboardLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels {
  return {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    overviewTitle: t("overviewTitle"),
    todayChip: t("todayChip"),
    metrics: buildMetricsLabels(t),
    activeMetrics: buildActiveMetricsLabels(t),
    activeWelcome: {
      title: t.raw("activeWelcome.title") as string,
      subtitle: t.raw("activeWelcome.subtitle") as string,
      overviewLabel: t("activeWelcome.overviewLabel"),
      mobileSummary: t.raw("activeWelcome.mobileSummary") as string,
    },
    schedule: buildScheduleLabels(t),
    status: buildStatusLabels(t),
    actions: buildActionLabels(t),
    activeControls: {
      liveNow: t("activeControls.liveNow"),
      sessionControls: t("activeControls.sessionControls"),
      startSession: t("activeControls.startSession"),
      markAbsent: t("activeControls.markAbsent"),
      requestLeave: t("activeControls.requestLeave"),
    },
    progressFeed: {
      title: t("progressFeed.title"),
    },
    alert: {
      title: t("alert.title"),
      description: t.raw("alert.description") as string,
    },
    policy: {
      title: t("policy.title"),
      description: t("policy.description"),
      descriptionMobile: t("policy.descriptionMobile"),
    },
    support: {
      liveSupport: t("support.liveSupport"),
    },
  };
}
