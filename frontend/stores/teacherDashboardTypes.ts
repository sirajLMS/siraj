export type TeacherSessionStatus =
  | "missed"
  | "pending"
  | "upcoming"
  | "completed"
  | "active"
  | "connecting"
  | "activated";

export interface TeacherScheduleRow {
  readonly id: string;
  readonly rowNumber: number;
  readonly classId: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly timeRange: string;
  readonly status: TeacherSessionStatus;
  readonly videoEnabled: boolean;
  readonly activateEnabled: boolean;
  readonly durationMinutes?: number;
  readonly courseTitle?: string;
  readonly locationLabel?: string;
  readonly isLive?: boolean;
  readonly isCurrent?: boolean;
}

export interface TeacherDashboardMetrics {
  readonly totalClasses: number;
  readonly missedSlots: number;
  readonly completed: number;
  readonly studentsToday: number;
  readonly activeSessions?: number;
}

export interface StudentProgressFeedItem {
  readonly id: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly summary: string;
  readonly timeAgo: string;
  readonly icon: "description" | "grade" | "login";
}

export interface MissedClassAlert {
  readonly classId: string;
  readonly scheduledTime: string;
}

export interface TeacherDashboardState {
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly missedAlert: MissedClassAlert | null;
  readonly scheduleDateLabel: string;
  readonly totalScheduledToday: number;
}
