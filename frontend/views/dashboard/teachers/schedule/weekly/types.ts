import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass } from "@/frontend/common/graphql/generated/gql/operations";

export type ScheduledClass = Omit<
  TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_WeeklyScheduleGrid_classes_WeeklyScheduleClass,
  "executionState" | "outcome"
> & {
  readonly executionState?: ClassExecutionState | null;
  readonly outcome?: ClassOutcome | null;
};

export interface TeacherWeeklySchedule {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly weeklyHoursWorked: string;
  readonly classes: readonly ScheduledClass[];
  readonly lastUpdated: string;
}

export interface WeeklyScheduleGridProps {
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
}

export interface MobileScheduleListProps {
  readonly classes: readonly ScheduledClass[];
  readonly onRemoveClass: (id: string) => void;
}

export interface TeacherWeeklyScheduleViewProps {
  readonly schedule: TeacherWeeklySchedule | null;
  readonly onRemoveClass: (id: string) => void;
  readonly onClearSchedule?: () => void;
  readonly onAddClass?: () => void;
}

export interface TeacherWeeklyScheduleContainerProps {
  readonly teacherId: string;
}

export interface CreateRecurringClassDialogProps {
  readonly teacherId: string;
  readonly onRefetch?: () => void;
}
