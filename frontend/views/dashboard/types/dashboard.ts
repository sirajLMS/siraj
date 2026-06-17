import type { SvgIconComponent } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

export interface NavItem {
  readonly key: string;
  readonly labelKey: string;
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

export type ClassStatus = "scheduled" | "in_progress" | "pending" | "completed" | "cancelled" | "absent";

export type ClassInstanceStatus = "active" | "scheduled" | "pending" | "completed" | "cancelled";

export interface StudentInfo {
  readonly id: string;
  readonly name: string;
  readonly grade: string;
  readonly level: number;
  readonly avatarUrl: string;
}

export interface TeacherInfo {
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

export interface ScheduleRow {
  readonly classId: string;
  readonly student: string;
  readonly teacher: string;
  readonly time: string;
  readonly status: ClassStatus;
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
  readonly rows: readonly ScheduleRow[];
  readonly headers: {
    readonly classId: string;
    readonly student: string;
    readonly teacher: string;
    readonly time: string;
    readonly status: string;
    readonly actions: string;
  };
  readonly statusLabels: Record<ClassStatus, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
  readonly showingText: string;
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
