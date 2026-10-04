import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import type { TeacherDashboardLabels as TeacherDashboardTranslator } from "@/shared/locale";

export function buildMetricsLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["metrics"] {
  return {
    totalClasses: t.metrics.totalClasses,
    missedSlots: t.metrics.missedSlots,
    completed: t.metrics.completed,
    studentsToday: t.metrics.studentsToday,
  };
}

export function buildActiveMetricsLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["activeMetrics"] {
  return {
    totalClasses: t.activeMetrics.totalClasses,
    activeSessions: t.activeMetrics.activeSessions,
    missedSlots: t.activeMetrics.missedSlots,
    completed: t.activeMetrics.completed,
  };
}

export function buildScheduleLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["schedule"] {
  return {
    title: t.schedule.title,
    titleToday: t.schedule.titleToday,
    rowNumber: t.schedule.rowNumber,
    classId: t.schedule.classId,
    student: t.schedule.student,
    time: t.schedule.time,
    status: t.schedule.status,
    contact: t.schedule.contact,
    actions: t.schedule.actions,
    showing: t.schedule.showing,
    noEntries: t.schedule.noEntries,
    sessionEnded: t.schedule.sessionEnded,
    frozen: t.schedule.frozen,
    contactAdmin: t.schedule.contactAdmin,
    duration: t.schedule.duration,
    durationValue: t.schedule.durationValue,
    current: t.schedule.current,
    viewAll: t.schedule.viewAll,
    meetingUrl: t.schedule.meetingUrl,
  };
}

export function buildStatusLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["status"] {
  return {
    missed: t.status.missed,
    pending: t.status.pending,
    upcoming: t.status.upcoming,
    completed: t.status.completed,
    active: t.status.active,
    connecting: t.status.connecting,
    activated: t.status.activated,
  };
}
