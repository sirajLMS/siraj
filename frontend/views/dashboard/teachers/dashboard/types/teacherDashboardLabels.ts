import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherDashboardLabels } from "@/shared/messages/types/dashboard/teachers/dashboard";

export type { TeacherDashboardLabels };

export interface TeacherDashboardViewLabels extends TeacherDashboardLabels {
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
}
