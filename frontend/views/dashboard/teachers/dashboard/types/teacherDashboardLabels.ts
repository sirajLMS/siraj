import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherDashboardLabels as BaseTeacherDashboardLabels } from "@/shared/messages/types/dashboard/teachers/dashboard";

export type TeacherDashboardLabels = BaseTeacherDashboardLabels;

export interface TeacherDashboardViewLabels extends TeacherDashboardLabels {
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
}
