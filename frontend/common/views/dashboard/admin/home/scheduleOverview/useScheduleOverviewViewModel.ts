"use client";

import { useMemo } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";

export interface ScheduleOverviewViewModel {
  readonly title: string;
  readonly searchPlaceholder: string;
  readonly searchValue: string;
  readonly dateLabel: string;
  readonly dateValue: string;
  readonly teacherPlaceholder: string;
  readonly selectedTeacher: PersonOption | null;
  readonly rows: readonly DailyScheduleRow[];
  readonly headers: {
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
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
  readonly selectedMetricLabel?: string | null;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount?: number;
  readonly loading?: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: PersonOption | null) => void;
  readonly onSubmit: () => void;
  readonly pageCount: number;
  readonly showTimezones: boolean;
  readonly locale: string;
  // NEW FOR PLAN v5: lifted permission booleans per specs.md §3 N3 + §6.1.
  // Tier schedule-overview views no longer import `RequirePermission` or
  // call `useUserStore()` — the ViewModel computes the gate ONCE and the
  // tier view reads the boolean as a plain prop.
  readonly canDashboardSearch: boolean;
  readonly canScheduleFilterAdvanced: boolean;
}

export type UseScheduleOverviewViewModelProps = Omit<
  ScheduleOverviewViewModel,
  "pageCount" | "showTimezones" | "locale" | "canDashboardSearch" | "canScheduleFilterAdvanced"
>;

function computePageCount(totalCount: number | undefined, pageSize: number): number {
  return totalCount !== undefined && totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
}

export function useScheduleOverviewViewModel(props: UseScheduleOverviewViewModelProps): ScheduleOverviewViewModel {
  const locale = useAppLocale();
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);
  // NEW FOR PLAN v5: compute the gates ONCE so the tier views no longer call
  // `useUserStore()` directly (specs.md §3 N3).
  const canDashboardSearch = hasPermission(AppPermission.DashboardSearch);
  const canScheduleFilterAdvanced = hasPermission(AppPermission.ScheduleFilterAdvanced);
  const pageCount = useMemo(
    () => computePageCount(props.totalCount, props.pageSize),
    [props.totalCount, props.pageSize]
  );

  return { ...props, pageCount, showTimezones, locale, canDashboardSearch, canScheduleFilterAdvanced };
}
