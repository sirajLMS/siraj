import { useMemo } from "react";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";
import { type AdminViewLabels, useAppTranslation } from "@/shared/locale";

type ClassDetailsTranslations = ReturnType<typeof useAppTranslation>["dashboardTranslations"]["classDetails"];

export interface TeacherViewLabels {
  readonly timezone: {
    readonly title: string;
    readonly message: (studentTimezone: string, teacherTimezone: string) => string;
  };
  readonly instanceDetails: {
    readonly classInstanceDetails: string;
    readonly studentName: string;
    readonly courseModule: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly duration: string;
    readonly status: string;
    readonly viewSubject: string;
    readonly minutes: string;
    readonly statusLabels: Record<ClassInstanceStatus, string>;
    readonly rateSectionTitle: string;
    readonly effectiveRateLabel: string;
    readonly rateCurrencyLabel: string;
    readonly rateSourceLabel: string;
    readonly rateSourceOverride: string;
    readonly rateSourceRecurring: string;
    readonly rateSourceSubject: string;
    readonly rateSourceTeacher: string;
    readonly overrideRateButton: string;
    readonly clearOverrideButton: string;
    readonly overrideRateDialogTitle: string;
    readonly overrideRateDialogDescription: string;
    readonly hourlyRateLabel: string;
    readonly currencyLabel: string;
    readonly saveButton: string;
    readonly cancelButton: string;
    readonly overrideSuccess: string;
    readonly overrideError: string;
    readonly clearSuccess: string;
    readonly clearError: string;
  };
  readonly remarks: {
    readonly remarksTitle: string;
  };
  readonly performance: {
    readonly previousPerformanceOverview: string;
    readonly attendanceRate: string;
    readonly avgGrade: string;
    readonly lastClass: string;
    readonly days: string;
    readonly noData: string;
  };
  readonly actions: {
    readonly actions: string;
    readonly activate: string;
    readonly stopPause: string;
    readonly infoEdit: string;
    readonly delete: string;
    readonly contextualHelp: string;
  };
  readonly studentProfile: {
    readonly viewFullProfile: string;
  };
}

function buildAdminActionsLabels(t: ClassDetailsTranslations) {
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

function buildAdminRateLabels(t: ClassDetailsTranslations) {
  return {
    rateSectionTitle: t.instanceDetails.rateSectionTitle,
    effectiveRateLabel: t.instanceDetails.effectiveRateLabel,
    rateCurrencyLabel: t.instanceDetails.rateCurrencyLabel,
    rateSourceLabel: t.instanceDetails.rateSourceLabel,
    rateSourceOverride: t.instanceDetails.rateSourceOverride,
    rateSourceRecurring: t.instanceDetails.rateSourceRecurring,
    rateSourceSubject: t.instanceDetails.rateSourceSubject,
    rateSourceTeacher: t.instanceDetails.rateSourceTeacher,
    overrideRateButton: t.instanceDetails.overrideRateButton,
    clearOverrideButton: t.instanceDetails.clearOverrideButton,
    overrideRateDialogTitle: t.instanceDetails.overrideRateDialogTitle,
    overrideRateDialogDescription: t.instanceDetails.overrideRateDialogDescription,
    hourlyRateLabel: t.instanceDetails.hourlyRateLabel,
    currencyLabel: t.instanceDetails.currencyLabel,
    saveButton: t.instanceDetails.saveButton,
    cancelButton: t.instanceDetails.cancelButton,
    overrideSuccess: t.instanceDetails.overrideSuccess,
    overrideError: t.instanceDetails.overrideError,
    clearSuccess: t.instanceDetails.clearSuccess,
    clearError: t.instanceDetails.clearError,
  };
}

function buildAdminViewLabels(t: ClassDetailsTranslations): AdminViewLabels {
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

function buildTeacherStatusLabels(t: ClassDetailsTranslations): Record<ClassInstanceStatus, string> {
  return {
    active: t.status.active,
    scheduled: t.status.scheduled,
    pending: t.status.pending,
    completed: t.status.completed,
    cancelled: t.status.cancelled,
  };
}

function buildTeacherInstanceDetailsLabels(
  t: ClassDetailsTranslations,
  statusLabels: Record<ClassInstanceStatus, string>
) {
  return {
    classInstanceDetails: t.instanceDetails.classInstanceDetails,
    studentName: t.instanceDetails.studentName,
    courseModule: t.instanceDetails.courseModule,
    startTime: t.instanceDetails.startTime,
    endTime: t.instanceDetails.endTime,
    duration: t.instanceDetails.duration,
    status: t.instanceDetails.status,
    viewSubject: t.instanceDetails.viewSubject,
    minutes: t.metadata.minutes,
    statusLabels,
    rateSectionTitle: t.instanceDetails.rateSectionTitle,
    effectiveRateLabel: t.instanceDetails.effectiveRateLabel,
    rateCurrencyLabel: t.instanceDetails.rateCurrencyLabel,
    rateSourceLabel: t.instanceDetails.rateSourceLabel,
    rateSourceOverride: t.instanceDetails.rateSourceOverride,
    rateSourceRecurring: t.instanceDetails.rateSourceRecurring,
    rateSourceSubject: t.instanceDetails.rateSourceSubject,
    rateSourceTeacher: t.instanceDetails.rateSourceTeacher,
    overrideRateButton: t.instanceDetails.overrideRateButton,
    clearOverrideButton: t.instanceDetails.clearOverrideButton,
    overrideRateDialogTitle: t.instanceDetails.overrideRateDialogTitle,
    overrideRateDialogDescription: t.instanceDetails.overrideRateDialogDescription,
    hourlyRateLabel: t.instanceDetails.hourlyRateLabel,
    currencyLabel: t.instanceDetails.currencyLabel,
    saveButton: t.instanceDetails.saveButton,
    cancelButton: t.instanceDetails.cancelButton,
    overrideSuccess: t.instanceDetails.overrideSuccess,
    overrideError: t.instanceDetails.overrideError,
    clearSuccess: t.instanceDetails.clearSuccess,
    clearError: t.instanceDetails.clearError,
  };
}

function buildTeacherViewLabels(t: ClassDetailsTranslations): TeacherViewLabels {
  const statusLabels = buildTeacherStatusLabels(t);

  return {
    timezone: {
      title: t.timezone.title,
      message: t.timezone.message,
    },
    instanceDetails: buildTeacherInstanceDetailsLabels(t, statusLabels),
    remarks: {
      remarksTitle: t.remarks.remarksTitle,
    },
    performance: {
      previousPerformanceOverview: t.performance.previousPerformanceOverview,
      attendanceRate: t.performance.attendanceRate,
      avgGrade: t.performance.avgGrade,
      lastClass: t.performance.lastClass,
      days: t.performance.days,
      noData: t.performance.noData,
    },
    actions: {
      actions: t.actions.actions,
      activate: t.actions.activate,
      stopPause: t.actions.stopPause,
      infoEdit: t.actions.infoEdit,
      delete: t.actions.delete,
      contextualHelp: t.actions.contextualHelp,
    },
    studentProfile: {
      viewFullProfile: t.studentProfile.viewFullProfile,
    },
  };
}

export const useAdminViewLabels = (_timezone: string): AdminViewLabels => {
  const t = useAppTranslation().dashboardTranslations.classDetails;

  return useMemo(() => buildAdminViewLabels(t), [t]);
};

export const useTeacherViewLabels = (_timezone: string): TeacherViewLabels => {
  const t = useAppTranslation().dashboardTranslations.classDetails;

  return useMemo(() => buildTeacherViewLabels(t), [t]);
};
