import type {
  ClassExecutionState,
  ClassOutcome,
  EffectiveMeeting,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export type ParentBookingStatus = "confirmed" | "rescheduled";

export type ParentLiveClassStatus = "starting_soon" | "pending" | "scheduled";

export interface ParentScheduleRow {
  readonly id: string;
  readonly rowNumber: number;
  readonly classTime: string;
  readonly durationMinutes: number;
  readonly studentId?: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly studentAvatarUrl?: string;
  readonly teacherId?: string;
  readonly teacherName: string;
  readonly teacherAvatarUrl?: string;
  readonly bookingStatus: ParentBookingStatus;
  readonly liveClassStatus: ParentLiveClassStatus;
  readonly executionState: ClassExecutionState;
  readonly outcome: ClassOutcome;
  readonly isFrozen: boolean;
  readonly videoEnabled: boolean;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeeting | null;
}

export interface StudentProgressItem {
  readonly id: string;
  readonly name: string;
  readonly completionPercent: number;
}

export interface ParentDashboardMetrics {
  readonly totalStudents: number;
  readonly todaysClasses: number;
  readonly pendingInvoicesCount: number;
  readonly pendingInvoicesAmount: string;
  readonly performanceAvg: number;
  readonly performanceAvgMobile: number;
  readonly pendingMessages: number;
}

export interface WorkshopPromo {
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
}
