import type { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export interface UpcomingClassDisplay {
  readonly id: string;
  readonly instructor: string;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly durationMinutes: number;
  readonly executionState: string;
  readonly isFrozen: boolean;
}

export interface StudentStatusPageData {
  readonly id: string;
  readonly name: string;
  readonly status: StudentStatus;
  readonly avatarUrl: string | null;
  readonly primaryTeacherId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: string | null;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly version: number | null;
  readonly upcomingClasses: readonly UpcomingClassDisplay[];
}

export interface StudentStatusViewProps {
  readonly student: StudentStatusPageData;
  readonly isUpdating: boolean;
  readonly onUpdateStatus: (status: StudentStatus, reason: string) => Promise<void>;
}

export interface StudentStatusHeaderProps {
  readonly student: StudentStatusPageData;
}

export interface UpcomingClassesTableProps {
  readonly classes: readonly UpcomingClassDisplay[];
  readonly studentId: string;
}

export interface AdminHoldControlsProps {
  readonly isUpdating: boolean;
}

export interface PolicyItemProps {
  readonly title: string;
  readonly description: string;
}
