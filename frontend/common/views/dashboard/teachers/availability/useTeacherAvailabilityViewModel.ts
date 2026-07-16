// cspell:disable
"use client";

import { useMemo } from "react";
import type {
  AvailabilityEntry,
  AvailabilitySearchFormData,
  TeacherAvailabilityInsights,
  WeeklyAvailability,
  WeeklyAvailabilityGridLabels,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { useAppTranslation } from "@/shared/locale/client";

export interface TeacherAvailabilityViewModel {
  readonly availability: WeeklyAvailability;
  readonly insights: TeacherAvailabilityInsights;
  readonly defaultFilters: AvailabilitySearchFormData;
  readonly loading?: boolean;
  readonly onExportPdf?: () => void;
  readonly onSearch?: (formData: AvailabilitySearchFormData) => void;
  readonly onBlockClick?: (entry: AvailabilityEntry) => void;
  readonly tableLabels: WeeklyAvailabilityGridLabels;
}

export type UseTeacherAvailabilityViewModelProps = Omit<TeacherAvailabilityViewModel, "tableLabels">;

export function useTeacherAvailabilityViewModel(
  props: UseTeacherAvailabilityViewModelProps
): TeacherAvailabilityViewModel {
  const { availability, insights, defaultFilters, loading, onExportPdf, onSearch, onBlockClick } = props;

  const t = useAppTranslation().dashboardTranslations.teacherAvailability;

  const tableLabels = useMemo<WeeklyAvailabilityGridLabels>(
    () => ({
      time: t.table.time,
      monday: t.table.monday,
      tuesday: t.table.tuesday,
      wednesday: t.table.wednesday,
      thursday: t.table.thursday,
      friday: t.table.friday,
      saturday: t.table.saturday,
      sunday: t.table.sunday,
      mon: t.table.mon,
      tue: t.table.tue,
      wed: t.table.wed,
      thu: t.table.thu,
      fri: t.table.fri,
      sat: t.table.sat,
      sun: t.table.sun,
    }),
    [t]
  );

  return {
    availability,
    insights,
    defaultFilters,
    loading,
    onExportPdf,
    onSearch,
    onBlockClick,
    tableLabels,
  };
}
