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
import type {
  TeacherAvailabilityLabelsBySection,
  TeacherAvailabilityShellLabels,
} from "@/frontend/common/views/dashboard/teachers/availability/types/teacherAvailabilityViewModel.types";
import { type CommonLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface TeacherAvailabilityViewModel {
  readonly labelsBySection: TeacherAvailabilityLabelsBySection;
  readonly availability: WeeklyAvailability;
  readonly insights: TeacherAvailabilityInsights;
  readonly defaultFilters: AvailabilitySearchFormData;
  readonly loading?: boolean;
  readonly onExportPdf?: () => void;
  readonly onSearch?: (formData: AvailabilitySearchFormData) => void;
  readonly onBlockClick?: (entry: AvailabilityEntry) => void;
}

export type UseTeacherAvailabilityViewModelProps = Omit<TeacherAvailabilityViewModel, "labelsBySection">;

export interface TeacherAvailabilityCoordinatorLabels {
  readonly shell: TeacherAvailabilityShellLabels;
  readonly common: Pick<CommonLabels, "loadFailed">;
}

/** Coordinator-only labels for `TeacherAvailabilityContainer` notifications and error UI. */
export function useTeacherAvailabilityCoordinatorLabels(): TeacherAvailabilityCoordinatorLabels {
  return {
    shell: useAppTranslation(Translation.Dashboard.TeacherAvailability),
    common: useAppTranslation(Translation.Common),
  };
}

export function useTeacherAvailabilityViewModel(
  props: UseTeacherAvailabilityViewModelProps
): TeacherAvailabilityViewModel {
  const { availability, insights, defaultFilters, loading, onExportPdf, onSearch, onBlockClick } = props;

  const t = useAppTranslation(Translation.Dashboard.TeacherAvailability);

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
      availableSlot: t.table.availableSlot,
    }),
    [t]
  );

  const { table: _table, ...shell } = t;

  return {
    labelsBySection: {
      shell,
      table: tableLabels,
    },
    availability,
    insights,
    defaultFilters,
    loading,
    onExportPdf,
    onSearch,
    onBlockClick,
  };
}
