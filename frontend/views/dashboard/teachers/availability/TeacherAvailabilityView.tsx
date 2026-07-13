// cspell:disable
"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { TeacherAvailabilityDesktopView } from "@/frontend/desktop/views/dashboard/teachers/availability/teacherAvailabilityView.desktop";
import { TeacherAvailabilityMobileView } from "@/frontend/mobile/views/dashboard/teachers/availability/teacherAvailabilityView.mobile";
import type {
  AvailabilityEntry,
  AvailabilitySearchFormData,
  TeacherAvailabilityInsights,
  WeeklyAvailability,
} from "@/frontend/views/dashboard/teachers/availability/types";
import {
  type TeacherAvailabilityViewModel,
  useTeacherAvailabilityViewModel,
} from "@/frontend/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";

export type { TeacherAvailabilityViewProps } from "@/frontend/views/dashboard/teachers/availability/types";
export type { TeacherAvailabilityViewModel };

export function TeacherAvailabilityView({
  availability,
  insights,
  defaultFilters,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
}: Readonly<{
  availability: WeeklyAvailability;
  insights: TeacherAvailabilityInsights;
  defaultFilters: AvailabilitySearchFormData;
  loading?: boolean;
  onExportPdf?: () => void;
  onSearch?: (formData: AvailabilitySearchFormData) => void;
  onBlockClick?: (entry: AvailabilityEntry) => void;
}>) {
  const viewModel = useTeacherAvailabilityViewModel({
    availability,
    insights,
    defaultFilters,
    loading,
    onExportPdf,
    onSearch,
    onBlockClick,
  });

  const { isMobile } = useViewport();

  return isMobile ? (
    <TeacherAvailabilityMobileView {...viewModel} />
  ) : (
    <TeacherAvailabilityDesktopView {...viewModel} />
  );
}
