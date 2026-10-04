import {
  buildTeacherStatusLabels,
  makeRateLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels.helpers";
import type {
  StudentViewLabels,
  TeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels.types";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";
import type { ClassDetailsLabels } from "@/shared/locale/types/dashboard/classes/details";

function buildTeacherInstanceDetailsLabels(t: ClassDetailsLabels, statusLabels: Record<ClassInstanceStatus, string>) {
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
    ...makeRateLabels(t.instanceDetails),
  };
}

export function buildTeacherViewLabels(t: ClassDetailsLabels): TeacherViewLabels {
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

export function buildStudentViewLabels(t: ClassDetailsLabels): StudentViewLabels {
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
    teacherProfile: {
      viewFullProfile: t.studentProfile.viewFullProfile,
    },
  };
}
