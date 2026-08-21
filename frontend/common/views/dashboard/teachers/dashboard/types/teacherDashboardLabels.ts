import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherDashboardLabels as BaseTeacherDashboardLabels } from "@/shared/locale/types/dashboard/teachers/dashboard";

export type TeacherDashboardLabels = BaseTeacherDashboardLabels & {
  readonly meetingLabels: {
    readonly emptyTeacher: string;
  };
};

export interface TeacherDashboardViewLabels extends TeacherDashboardLabels {
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
}

export interface TeacherDashboardLastUpdatedLabels {
  readonly updatedJustNow: string;
  readonly updatedMinutesAgo: (minutes: number) => string;
}
