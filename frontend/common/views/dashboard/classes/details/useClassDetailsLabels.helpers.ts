import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";
import type { AdminViewLabels } from "@/shared/locale";
import type { ClassDetailsLabels } from "@/shared/locale/types/dashboard/classes/details";

/**
 * Extract the 19 rate-related label fields from `instanceDetails`.
 * Shared by `buildAdminRateLabels` and `buildTeacherInstanceDetailsLabels`.
 */
export function makeRateLabels(id: ClassDetailsLabels["instanceDetails"]) {
  return {
    rateSectionTitle: id.rateSectionTitle,
    effectiveRateLabel: id.effectiveRateLabel,
    rateCurrencyLabel: id.rateCurrencyLabel,
    rateSourceLabel: id.rateSourceLabel,
    rateSourceOverride: id.rateSourceOverride,
    rateSourceRecurring: id.rateSourceRecurring,
    rateSourceSubject: id.rateSourceSubject,
    rateSourceTeacher: id.rateSourceTeacher,
    overrideRateButton: id.overrideRateButton,
    clearOverrideButton: id.clearOverrideButton,
    overrideRateDialogTitle: id.overrideRateDialogTitle,
    overrideRateDialogDescription: id.overrideRateDialogDescription,
    hourlyRateLabel: id.hourlyRateLabel,
    currencyLabel: id.currencyLabel,
    saveButton: id.saveButton,
    cancelButton: id.cancelButton,
    overrideSuccess: id.overrideSuccess,
    overrideError: id.overrideError,
    clearSuccess: id.clearSuccess,
    clearError: id.clearError,
  };
}

function buildAdminActionsLabels(t: ClassDetailsLabels) {
  return {
    administrativeActions: t.adminActions.administrativeActions,
    generateLog: t.adminActions.generateLog,
    reschedule: t.adminActions.reschedule,
    forceActivate: t.adminActions.forceActivate,
    stopPause: t.adminActions.stopPause,
    deleteInstance: t.adminActions.deleteInstance,
    overrideRateButton: t.instanceDetails.overrideRateButton,
    disabledTooltips: {
      forceActivate: {
        activated: t.adminActions.disabledTooltips.forceActivate.activated,
        running: t.adminActions.disabledTooltips.forceActivate.running,
        completed: t.adminActions.disabledTooltips.forceActivate.completed,
      },
      stop: {
        notActivated: t.adminActions.disabledTooltips.stop.notActivated,
        activated: t.adminActions.disabledTooltips.stop.activated,
        completed: t.adminActions.disabledTooltips.stop.completed,
      },
    },
  };
}

function buildAdminRateLabels(t: ClassDetailsLabels) {
  return makeRateLabels(t.instanceDetails);
}

export function buildAdminViewLabels(t: ClassDetailsLabels): AdminViewLabels {
  return {
    admin: {
      pageTitle: t.pageSubtitleAdmin,
      roleLabel: t.pageSubtitleAdmin,
    },
    timezone: {
      title: t.timezone.title,
      message: t.timezone.message,
    },
    adminActions: buildAdminActionsLabels(t),
    classInfo: {
      liveInstance: t.classInfo.liveInstance,
      activeConnection: t.classInfo.activeConnection,
      student: t.classInfo.student,
      moduleInstructor: t.classInfo.moduleInstructor,
      viewSubject: t.classInfo.viewSubject,
    },
    metadata: {
      metadata: t.metadata.metadata,
      scheduledDate: t.metadata.scheduledDate,
      duration: t.metadata.duration,
      latency: t.metadata.latency,
      authorization: t.metadata.authorization,
      minutes: t.metadata.minutes,
      optimal: t.metadata.optimal,
      unavailable: t.metadata.unavailable,
    },
    performance: {
      livePerformanceOverview: t.performance.livePerformanceOverview,
      last30Mins: t.performance.last30Mins,
      engagementScore: t.performance.engagementScore,
      assessmentProgress: t.performance.assessmentProgress,
      focusLevel: t.performance.focusLevel,
      sessionHealth: t.performance.sessionHealth,
      noData: t.performance.noData,
    },
    heatmap: {
      activityHeatmap: t.heatmap.activityHeatmap,
      studentInput: t.heatmap.studentInput,
      teacherResponse: t.heatmap.teacherResponse,
      noData: t.heatmap.noData,
    },
    rate: buildAdminRateLabels(t),
  };
}

/** Locale status labels keyed by the generated class instance status enum. */
export function buildTeacherStatusLabels(t: ClassDetailsLabels): Record<ClassInstanceStatus, string> {
  return {
    active: t.status.active,
    scheduled: t.status.scheduled,
    pending: t.status.pending,
    completed: t.status.completed,
    cancelled: t.status.cancelled,
  };
}
