"use client";

import { Box, CircularProgress } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { useTeacherAvailabilityStore } from "@/frontend/common/stores/teacherAvailabilityStore";
import { availabilitySearchResolverFactory } from "@/frontend/common/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type { AvailabilitySearchFormData } from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { TeacherAvailabilityViewModel } from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import { DesktopExportButton, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { AvailabilityInsightsDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilityInsights.desktop";
import { AvailabilitySearchFormDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilitySearchForm.desktop";
import { WeeklyAvailabilityGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.desktop";

export function TeacherAvailabilityDesktopView({
  labelsBySection,
  availability,
  insights,
  defaultFilters,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
}: Readonly<TeacherAvailabilityViewModel>) {
  const { shell: labels, table: tableLabels } = labelsBySection;
  const storeFilters = useTeacherAvailabilityStore(
    (state: { readonly filters: AvailabilitySearchFormData }) => state.filters
  );

  const storeHasDraft = storeFilters.fromTime !== null || storeFilters.toTime !== null || storeFilters.gender !== null;

  const methods = useForm<AvailabilitySearchFormData>({
    resolver: availabilitySearchResolverFactory({ invalidGender: labels.validation.invalidGender }),
    defaultValues: storeHasDraft ? storeFilters : defaultFilters,
  });

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        breadcrumbs={[
          { label: labels.breadcrumbs.teachers, href: "/teachers" },
          { label: labels.breadcrumbs.availability, current: true },
        ]}
        actions={<DesktopExportButton onClick={onExportPdf}>{labels.exportPdf}</DesktopExportButton>}
      />

      <Box sx={{ mb: 4 }}>
        <DesktopSectionPanel title={labels.searchTitle}>
          <FormProvider {...methods}>
            <AvailabilitySearchFormDesktop
              onSearch={onSearch}
              labels={{
                searchTitle: labels.searchTitle,
                from: labels.from,
                to: labels.to,
                gender: labels.gender,
                any: labels.any,
                male: labels.male,
                female: labels.female,
                submit: labels.submit,
              }}
            />
          </FormProvider>
        </DesktopSectionPanel>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <WeeklyAvailabilityGridDesktop availability={availability} labels={tableLabels} onBlockClick={onBlockClick} />
      )}

      <AvailabilityInsightsDesktop insights={insights} labels={labels.insights} />
    </DesktopPageContainer>
  );
}
