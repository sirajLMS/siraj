"use client";

import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
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
