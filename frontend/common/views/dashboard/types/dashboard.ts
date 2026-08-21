import type {
  AppPermission,
  ClassExecutionState,
  ClassInstanceQuery_classInstance,
  ClassInstanceQuery_classInstance_student,
  ClassInstanceQuery_classInstance_teacher,
  ClassOutcome,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherFilterItem } from "@/frontend/common/types/shared.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { NavIconKey } from "@/frontend/common/views/dashboard/config/navIconKeys";
import type { DashboardNavigationLabels } from "@/shared/locale";

export type NavAudience = "teacher" | "parent" | "student" | "supervisor";

export interface NavItem {
  readonly key: string;
  readonly labelKey: keyof DashboardNavigationLabels;
  readonly iconKey: NavIconKey;
  readonly href: string;
  readonly section: "main" | "footer";
  readonly permission?: AppPermission | readonly AppPermission[];
  readonly audience?: NavAudience;
  /**
   * Group this item belongs to in the sidebar. When omitted the item renders
   * un-grouped (still respects `section`). Must match a `NavGroup.id` from
   * `SIDEBAR_NAV_GROUPS`. Mobile bottom nav ignores grouping entirely.
   */
  readonly groupId?: string;
}

/**
 * Sidebar navigation group: a labelled, optionally-collapsible cluster of
 * `NavItem`s rendered together with a header row (icon + label + chevron).
 * Groups can declare their own `permission`/`audience` gate so the entire
 * cluster hides for users who lack access. A `separator: true` group renders
 * a `<Divider>` before its header. `main`-section groups render above the
 * footer divider; `footer`-section groups render below it.
 */
export interface NavGroup {
  readonly id: string;
  readonly labelKey: keyof DashboardNavigationLabels;
  readonly iconKey?: NavIconKey;
  readonly section: "main" | "footer";
  readonly permission?: AppPermission | readonly AppPermission[];
  readonly audience?: NavAudience;
  readonly defaultCollapsed?: boolean;
  readonly separator?: boolean;
}

export type ClassInstanceStatus = "active" | "scheduled" | "pending" | "completed" | "cancelled";

// Re-export generated GraphQL types to replace local duplicates
export type StudentInfo = ClassInstanceQuery_classInstance_student;
export type TeacherInfo = ClassInstanceQuery_classInstance_teacher;
export type ClassInstance = ClassInstanceQuery_classInstance;

export interface PerformanceMetric {
  readonly key: string;
  readonly labelKey: string;
  readonly value: string;
}

export type ScheduleOverviewDataHeaders = {
  readonly className: string;
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
  readonly joinVideo: string;
};

export type ScheduleOverviewDataStatusLabels = Record<ClassOutcome | ClassExecutionState, string>;

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
  readonly headers: ScheduleOverviewDataHeaders;
  readonly statusLabels: ScheduleOverviewDataStatusLabels;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
  readonly selectedMetricLabel?: string | null;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount?: number;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
  readonly loading?: boolean;
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
} from "@/frontend/common/types/shared.types";
