import type { SvgIconComponent } from "@mui/icons-material";
import type { AppPermission, ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/dashboard/types/schedule";
import type { DashboardNavigationLabels } from "@/shared/messages/types/message";

export interface NavItem {
  readonly key: string;
  readonly labelKey: `dashboard.nav.${keyof DashboardNavigationLabels}`;
  readonly icon: SvgIconComponent;
  readonly href: string;
  readonly section: "main" | "footer";
  readonly permission?: AppPermission | readonly AppPermission[];
}

export interface MetricItem {
  readonly key: string;
  readonly count: number | string;
  readonly labelKey: string;
  readonly label?: string;
  readonly icon: SvgIconComponent;
  readonly subLabel?: string;
  readonly variant?: "default" | "error" | "highlight" | "danger" | "compact";
}

export type ClassInstanceStatus = "active" | "scheduled" | "pending" | "completed" | "cancelled";

export interface StudentInfo {
  readonly id: string;
  readonly name: string;
  readonly grade: string;
  readonly level: number;
  readonly avatarUrl: string;
}

export interface TeacherInfo {
  readonly id?: string;
  readonly name: string;
  readonly title: string;
  readonly avatarUrl: string;
}

export interface PerformanceMetric {
  readonly key: string;
  readonly labelKey: string;
  readonly value: string;
}

export interface ClassInstance {
  readonly id: string;
  readonly instanceId: string;
  readonly courseName: string;
  readonly student: StudentInfo;
  readonly teacher: TeacherInfo;
  readonly scheduledDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly status: ClassInstanceStatus;
  readonly latencyMs: number;
  readonly authorization: string;
  readonly remarks: string;
  readonly hasTimezoneMismatch: boolean;
  readonly studentTimezone: string;
  readonly performanceMetrics: readonly PerformanceMetric[];
  readonly heatmapData: readonly number[];
  readonly attendanceRate: number;
  readonly avgGrade: string;
  readonly lastClassDaysAgo: number;
}

export interface TeacherFilterItem {
  readonly id: string;
  readonly name: string;
}

export interface ScheduleOverviewData {
  readonly searchPlaceholder: string;
  readonly searchValue: string;
  readonly dateLabel: string;
  readonly dateValue: string;
  readonly teacherPlaceholder: string;
  readonly teacherValue: string;
  readonly submitLabel: string;
  readonly teachers: readonly TeacherFilterItem[];
  readonly rows: readonly DailyScheduleRow[];
  readonly headers: {
    readonly student: string;
    readonly teacher: string;
    readonly time: string;
    readonly yourTime: string;
    readonly teacherTime: string;
    readonly studentTime: string;
    readonly duration: string;
    readonly status: string;
    readonly actions: string;
    readonly history: string;
  };
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
  readonly selectedMetricLabel?: string | null;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
}

export interface UserInfo {
  readonly name: string;
  readonly role: string;
  readonly avatarUrl: string;
  readonly permissions: readonly AppPermission[];
  readonly notificationCount: number;
}

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
  readonly studentId?: string;
  readonly zoomMeetingUrl?: string | null;
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
