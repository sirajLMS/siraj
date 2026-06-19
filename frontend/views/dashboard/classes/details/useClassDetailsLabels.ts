import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";
import type { AdminViewLabels } from "@/shared/messages/types/message";

export interface TeacherViewLabels {
  readonly timezone: {
    readonly title: string;
    readonly description: string;
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
    readonly studentLevel: string;
    readonly viewFullProfile: string;
  };
}

export const useAdminViewLabels = (timezone: string): AdminViewLabels => {
  const t = useTranslations("dashboard.classDetails");

  return useMemo(
    () => ({
      timezone: {
        title: t("timezone.title"),
        description: t("timezone.description", { timezone }),
      },
      adminActions: {
        administrativeActions: t("adminActions.administrativeActions"),
        generateLog: t("adminActions.generateLog"),
        reschedule: t("adminActions.reschedule"),
      },
      classInfo: {
        liveInstance: t("classInfo.liveInstance"),
        activeConnection: t("classInfo.activeConnection"),
        student: t("classInfo.student"),
        moduleInstructor: t("classInfo.moduleInstructor"),
      },
      metadata: {
        metadata: t("metadata.metadata"),
        scheduledDate: t("metadata.scheduledDate"),
        duration: t("metadata.duration"),
        latency: t("metadata.latency"),
        authorization: t("metadata.authorization"),
        minutes: t("metadata.minutes"),
        optimal: t("metadata.optimal"),
      },
      performance: {
        livePerformanceOverview: t("performance.livePerformanceOverview"),
        last30Mins: t("performance.last30Mins"),
        engagementScore: t("performance.engagementScore"),
        assessmentProgress: t("performance.assessmentProgress"),
        focusLevel: t("performance.focusLevel"),
        sessionHealth: t("performance.sessionHealth"),
      },
      heatmap: {
        activityHeatmap: t("heatmap.activityHeatmap"),
        studentInput: t("heatmap.studentInput"),
        teacherResponse: t("heatmap.teacherResponse"),
      },
    }),
    [t, timezone]
  );
};

export const useTeacherViewLabels = (timezone: string): TeacherViewLabels => {
  const t = useTranslations("dashboard.classDetails");

  return useMemo(() => {
    const statusLabels: Record<ClassInstanceStatus, string> = {
      active: t("status.active"),
      scheduled: t("status.scheduled"),
      pending: t("status.pending"),
      completed: t("status.completed"),
      cancelled: t("status.cancelled"),
    };

    return {
      timezone: {
        title: t("timezone.title"),
        description: t("timezone.description", { timezone }),
      },
      instanceDetails: {
        classInstanceDetails: t("instanceDetails.classInstanceDetails"),
        studentName: t("instanceDetails.studentName"),
        courseModule: t("instanceDetails.courseModule"),
        startTime: t("instanceDetails.startTime"),
        endTime: t("instanceDetails.endTime"),
        duration: t("instanceDetails.duration"),
        status: t("instanceDetails.status"),
        minutes: t("metadata.minutes"),
        statusLabels,
      },
      remarks: {
        remarksTitle: t("remarks.remarksTitle"),
      },
      performance: {
        previousPerformanceOverview: t("performance.previousPerformanceOverview"),
        attendanceRate: t("performance.attendanceRate"),
        avgGrade: t("performance.avgGrade"),
        lastClass: t("performance.lastClass"),
        days: t("performance.days"),
      },
      actions: {
        actions: t("actions.actions"),
        activate: t("actions.activate"),
        stopPause: t("actions.stopPause"),
        infoEdit: t("actions.infoEdit"),
        delete: t("actions.delete"),
        contextualHelp: t("actions.contextualHelp"),
      },
      studentProfile: {
        studentLevel: t("studentProfile.studentLevel"),
        viewFullProfile: t("studentProfile.viewFullProfile"),
      },
    };
  }, [t, timezone]);
};
