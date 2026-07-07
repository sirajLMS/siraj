import type { SvgIconComponent } from "@mui/icons-material";
import type {
  AppPermission,
  ClassExecutionState,
  ClassInstanceDetail,
  ClassInstanceStudentInfo,
  ClassInstanceTeacherInfo,
  ClassOutcome,
  DailyScheduleList,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherFilterItem } from "@/frontend/types/shared.types";
import type { DashboardNavigationLabels } from "@/shared/messages/types/message";

export type { DashboardFilters, MetricItem, Pagination, TeacherFilterItem } from "@/frontend/types/shared.types";

export type DailyScheduleRow = DailyScheduleList;

export type NavAudience = "teacher" | "parent";

export interface NavItem {
  readonly key: string;
  readonly labelKey: `dashboard.nav.${keyof DashboardNavigationLabels}`;
  readonly icon: SvgIconComponent;
  readonly href: string;
  readonly section: "main" | "footer";
  readonly permission?: AppPermission | readonly AppPermission[];
  readonly audience?: NavAudience;
}

export type ClassInstanceStatus = "active" | "scheduled" | "pending" | "completed" | "cancelled";

// Re-export generated GraphQL types to replace local duplicates
export type StudentInfo = ClassInstanceStudentInfo;
export type TeacherInfo = ClassInstanceTeacherInfo;
export type ClassInstance = ClassInstanceDetail;

export interface PerformanceMetric {
  readonly key: string;
  readonly labelKey: string;
  readonly value: string;
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

export type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
  TeacherSessionStatus,
} from "@/frontend/types/shared.types";
