// cspell:disable
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { ExportButton, SectionPanel } from "@/frontend/common/components/ui";
import { useTeacherAvailabilityStore } from "@/frontend/common/stores/teacherAvailabilityStore";
import { availabilitySearchSchema } from "@/frontend/common/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type {
  AvailabilitySearchFormData,
  TeacherAvailabilityInsights,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { TeacherAvailabilityViewModel } from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { AvailabilitySearchFormMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/availabilitySearchForm.mobile";
import { WeeklyAvailabilityGridMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.mobile";
import { useAppTranslation } from "@/shared/locale";

interface TeacherAvailabilityMobileViewProps extends Omit<TeacherAvailabilityViewModel, "insights"> {
  readonly insights?: TeacherAvailabilityInsights;
}

function resolveDefaultFilters(
  propFilters: AvailabilitySearchFormData,
  storeFilters: { readonly fromTime: Date | null; readonly toTime: Date | null; readonly gender: unknown }
): AvailabilitySearchFormData {
  const storeHasDraft = storeFilters.fromTime !== null || storeFilters.toTime !== null || storeFilters.gender !== null;
  return storeHasDraft ? (storeFilters as AvailabilitySearchFormData) : propFilters;
}

export function TeacherAvailabilityMobileView({
  availability,
  defaultFilters,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
  tableLabels,
}: Readonly<TeacherAvailabilityMobileViewProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherAvailability;
  const storeFilters = useTeacherAvailabilityStore(
    (state: { readonly filters: AvailabilitySearchFormData }) => state.filters
  );

  const methods = useForm<AvailabilitySearchFormData>({
    resolver: zodResolver(availabilitySearchSchema),
    defaultValues: resolveDefaultFilters(defaultFilters, storeFilters),
  });

  return (
    <PageContainer>
      <MobilePageHeader
        title={t.mobile.pageTitle}
        subtitle={t.mobile.pageSubtitle}
        breadcrumbs={[
          { label: t.breadcrumbs.teachers, href: "/teachers" },
          { label: t.breadcrumbs.availability, current: true },
        ]}
        actions={<ExportButton onClick={onExportPdf}>{t.exportPdf}</ExportButton>}
      />

      <Box sx={{ mb: 2 }}>
        <SectionPanel title={t.searchTitle} edgeToEdge>
          <FormProvider {...methods}>
            <AvailabilitySearchFormMobile onSearch={onSearch} />
          </FormProvider>
        </SectionPanel>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <WeeklyAvailabilityGridMobile availability={availability} labels={tableLabels} onBlockClick={onBlockClick} />
      )}
    </MobilePageContainer>
  );
}
