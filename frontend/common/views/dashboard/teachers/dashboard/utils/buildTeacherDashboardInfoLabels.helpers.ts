import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import type { TeacherDashboardLabels as TeacherDashboardTranslator } from "@/shared/locale";

export function buildActiveWelcomeLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["activeWelcome"] {
  return {
    title: t.activeWelcome.title,
    subtitle: t.activeWelcome.subtitle,
    overviewLabel: t.activeWelcome.overviewLabel,
    mobileSummary: t.activeWelcome.mobileSummary,
  };
}

export function buildProgressFeedLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["progressFeed"] {
  return {
    title: t.progressFeed.title,
    autoMissedTooltip: t.progressFeed.autoMissedTooltip,
    events: {
      auto_missed: t.progressFeed.events.auto_missed,
      marked_absent: t.progressFeed.events.marked_absent,
      activated: t.progressFeed.events.activated,
      started: t.progressFeed.events.started,
      completed: t.progressFeed.events.completed,
      leave: t.progressFeed.events.leave,
      other: t.progressFeed.events.other,
    },
  };
}

export function buildAlertLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["alert"] {
  return {
    title: t.alert.title,
    description: t.alert.description,
  };
}

export function buildPolicyLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["policy"] {
  return {
    title: t.policy.title,
    description: t.policy.description,
    descriptionMobile: t.policy.descriptionMobile,
  };
}

export function buildDateFilterLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["dateFilter"] {
  return {
    today: t.dateFilter.today,
    previousDay: t.dateFilter.previousDay,
    nextDay: t.dateFilter.nextDay,
    dateLabel: t.dateFilter.dateLabel,
  };
}

export function buildSupportLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["support"] {
  return {
    liveSupport: t.support.liveSupport,
  };
}

export function buildErrorLabels(t: TeacherDashboardTranslator): TeacherDashboardLabels["errors"] {
  return {
    meetingUrlNotAvailable: t.errors.meetingUrlNotAvailable,
    handbookUrlNotFound: t.errors.handbookUrlNotFound,
    missedClassTime: t.errors.missedClassTime,
    activationFailed: t.errors.activationFailed,
  };
}
