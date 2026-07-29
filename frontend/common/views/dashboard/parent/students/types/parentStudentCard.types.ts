import type { StudentAccountStatus } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { ParentStudentsLabels } from "@/shared/locale/types/dashboard/parents/students";

export interface ParentStudentCardLabels {
  readonly classesLeft: string;
  readonly weeklyHours: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
}

export function buildParentStudentCardLabels(labels: ParentStudentsLabels): ParentStudentCardLabels {
  return {
    classesLeft: labels.card.classesLeft,
    weeklyHours: labels.card.weeklyHours,
    statusLabels: {
      deactivated: labels.status.deactivated,
      regular: labels.status.regular,
      on_leave: labels.status.onLeave,
      suspended: labels.status.suspended,
      on_trial: labels.status.onTrial,
    },
  };
}
