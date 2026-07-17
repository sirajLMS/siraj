// cspell:disable
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { ExportButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import { useTeacherAvailabilityStore } from "@/frontend/common/stores/teacherAvailabilityStore";
import { availabilitySearchSchema } from "@/frontend/common/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type { AvailabilitySearchFormData } from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { TeacherAvailabilityViewModel } from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import { AvailabilityInsightsDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilityInsights.desktop";
import { AvailabilitySearchFormDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilitySearchForm.desktop";
import { WeeklyAvailabilityGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

export function TeacherAvailabilityDesktopView({
  availability,
  insights,
  defaultFilters,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
  tableLabels,
}: Readonly<TeacherAvailabilityViewModel>) {
  const t = useAppTranslation().dashboardTranslations.teacherAvailability;
  const storeFilters = useTeacherAvailabilityStore(
    (state: { readonly filters: AvailabilitySearchFormData }) => state.filters
  );

  const storeHasDraft = storeFilters.fromTime !== null || storeFilters.toTime !== null || storeFilters.gender !== null;

  const methods = useForm<AvailabilitySearchFormData>({
    resolver: zodResolver(availabilitySearchSchema),
    defaultValues: storeHasDraft ? storeFilters : defaultFilters,
  });

  return (
    <PageContainer>
      <PageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        breadcrumbs={[
          { label: t.breadcrumbs.teachers, href: "/teachers" },
          { label: t.breadcrumbs.availability, current: true },
        ]}
        actions={<ExportButton onClick={onExportPdf}>{t.exportPdf}</ExportButton>}
      />

      <Box sx={{ mb: 4 }}>
        <SectionPanel title={t.searchTitle}>
          <FormProvider {...methods}>
            <AvailabilitySearchFormDesktop onSearch={onSearch} />
          </FormProvider>
        </SectionPanel>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <WeeklyAvailabilityGridDesktop availability={availability} labels={tableLabels} onBlockClick={onBlockClick} />
      )}

      <AvailabilityInsightsDesktop insights={insights} />
    </PageContainer>
  );
}
