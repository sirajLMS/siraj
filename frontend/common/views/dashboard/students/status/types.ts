import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";

export interface UpcomingClassDisplay {
  readonly id: string;
  readonly instructor: string;
  readonly teacherId: string | null;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly durationMinutes: number;
  readonly executionState: string;
  readonly outcome: string | null;
  readonly isFrozen: boolean;
  readonly meetingJoinUrl: string | null | undefined;
  readonly effectiveMeeting: EffectiveMeetingFieldsFragment | null | undefined;
}

export interface StudentStatusPageData {
  readonly id: string;
  readonly name: string;
  readonly status: StudentStatus;
  readonly avatarUrl: string | null;
  readonly primaryTeacherId: string | null;
  readonly teacherName: string | null;
  readonly parentUserId?: string | null;
  readonly hoursPerWeek: string | null;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly version: number | null;
  readonly upcomingClasses: readonly UpcomingClassDisplay[];
}

export interface StudentStatusViewProps {
  readonly student: StudentStatusPageData;
  readonly isUpdating: boolean;
  readonly embedded?: boolean;
  readonly onUpdateStatus: (status: StudentStatus, reason: string) => Promise<void>;
}

export interface StudentStatusHeaderProps {
  readonly student: StudentStatusPageData;
  readonly embedded?: boolean;
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
