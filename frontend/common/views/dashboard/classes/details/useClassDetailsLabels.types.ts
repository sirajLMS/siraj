import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";
import type { ClassRateLabels } from "@/shared/locale/types/dashboard/admin/view";

/** View-layer label bag for the teacher variant of the class details screen. */
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
  } & ClassRateLabels;
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

/** View-layer label bag for the student variant of the class details screen. */
export interface StudentViewLabels {
  readonly timezone: TeacherViewLabels["timezone"];
  readonly instanceDetails: TeacherViewLabels["instanceDetails"];
  readonly remarks: TeacherViewLabels["remarks"];
  readonly teacherProfile: {
    readonly viewFullProfile: string;
  };
}
