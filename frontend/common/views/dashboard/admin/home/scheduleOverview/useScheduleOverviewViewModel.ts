"use client";

import { useMemo } from "react";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { TeacherFilterItem } from "@/frontend/common/types/shared.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";

export interface ScheduleOverviewViewModel {
  readonly title: string;
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
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
  readonly pageCount: number;
  readonly showTimezones: boolean;
  readonly locale: string;
}

export type UseScheduleOverviewViewModelProps = Omit<
  ScheduleOverviewViewModel,
  "pageCount" | "showTimezones" | "locale"
>;

function computePageCount(totalCount: number | undefined, pageSize: number): number {
  return totalCount !== undefined && totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
}

export function useScheduleOverviewViewModel(props: UseScheduleOverviewViewModelProps): ScheduleOverviewViewModel {
  const locale = useAppLocale();
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);
  const pageCount = useMemo(
    () => computePageCount(props.totalCount, props.pageSize),
    [props.totalCount, props.pageSize]
  );

  return { ...props, pageCount, showTimezones, locale };
}
