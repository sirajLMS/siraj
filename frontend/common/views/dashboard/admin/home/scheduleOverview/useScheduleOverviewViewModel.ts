"use client";

import { useMemo } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleOverviewLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/scheduleOverview.types";

export interface ScheduleOverviewViewModel {
  readonly labelsBySection: ScheduleOverviewLabelsBySection;
  readonly searchValue: string;
  readonly dateValue: string;
  readonly selectedTeacher: PersonOption | null;
  readonly rows: readonly DailyScheduleRow[];
  readonly selectedMetricLabel?: string | null;
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
  const canDashboardSearch = hasPermission(AppPermission.DashboardSearch);
  const canScheduleFilterAdvanced = hasPermission(AppPermission.ScheduleFilterAdvanced);
  const pageCount = useMemo(
    () => computePageCount(props.totalCount, props.pageSize),
    [props.totalCount, props.pageSize]
  );

  return {
    ...props,
    pageCount,
    showTimezones,
    locale,
    canDashboardSearch,
    canScheduleFilterAdvanced,
  };
}
