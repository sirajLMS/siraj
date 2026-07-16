import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherDashboardLabels as BaseTeacherDashboardLabels } from "@/shared/locale/types/dashboard/teachers/dashboard";

export type TeacherDashboardLabels = BaseTeacherDashboardLabels & {
  readonly meetingLabels: {
    readonly emptyTeacher: string;
  };
};

export interface TeacherDashboardViewLabels extends TeacherDashboardLabels {
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
}
