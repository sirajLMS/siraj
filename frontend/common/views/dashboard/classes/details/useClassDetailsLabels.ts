import { useMemo } from "react";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";
import { useAppTranslation } from "@/shared/locale/client";
import type { AdminViewLabels } from "@/shared/locale/types/dashboard/admin/view";

export interface TeacherViewLabels {
  readonly timezone: {
    readonly title: string;
    readonly prefix: string;
    readonly suffix: string;
  };
  readonly instanceDetails: {
    readonly classInstanceDetails: string;
    readonly studentName: string;
    readonly courseModule: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly duration: string;
    readonly status: string;
    readonly minutes: string;
    readonly statusLabels: Record<ClassInstanceStatus, string>;
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

export const useAdminViewLabels = (_timezone: string): AdminViewLabels => {
  const t = useAppTranslation("dashboard.classDetails");

  return useMemo(
    () => ({
      timezone: {
        title: t.timezone.title,
        prefix: t.timezone.prefix,
        suffix: t.timezone.suffix,
      },
      adminActions: {
        administrativeActions: t.adminActions.administrativeActions,
        generateLog: t.adminActions.generateLog,
        reschedule: t.adminActions.reschedule,
        forceActivate: t.adminActions.forceActivate,
        stopPause: t.adminActions.stopPause,
        deleteInstance: t.adminActions.deleteInstance,
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
      },
      classInfo: {
        liveInstance: t.classInfo.liveInstance,
        activeConnection: t.classInfo.activeConnection,
        student: t.classInfo.student,
        moduleInstructor: t.classInfo.moduleInstructor,
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
    }),
    [t]
  );
};

export const useTeacherViewLabels = (_timezone: string): TeacherViewLabels => {
  const t = useAppTranslation("dashboard.classDetails");

  return useMemo(() => {
    const statusLabels: Record<ClassInstanceStatus, string> = {
      active: t.status.active,
      scheduled: t.status.scheduled,
      pending: t.status.pending,
      completed: t.status.completed,
      cancelled: t.status.cancelled,
    };

    return {
      timezone: {
        title: t.timezone.title,
        prefix: t.timezone.prefix,
        suffix: t.timezone.suffix,
      },
      instanceDetails: {
        classInstanceDetails: t.instanceDetails.classInstanceDetails,
        studentName: t.instanceDetails.studentName,
        courseModule: t.instanceDetails.courseModule,
        startTime: t.instanceDetails.startTime,
        endTime: t.instanceDetails.endTime,
        duration: t.instanceDetails.duration,
        status: t.instanceDetails.status,
        minutes: t.metadata.minutes,
        statusLabels,
      },
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
  }, [t]);
};
