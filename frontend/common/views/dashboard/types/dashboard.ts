import type { AppPermission, ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NavIconKey } from "@/frontend/common/views/dashboard/config/navIconKeys";
import type { DashboardNavigationLabels } from "@/shared/locale";

type NavAudience = "teacher" | "parent" | "student" | "supervisor";

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
