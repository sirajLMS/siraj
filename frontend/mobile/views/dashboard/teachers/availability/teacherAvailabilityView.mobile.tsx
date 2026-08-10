"use client";

import { Box, CircularProgress } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import type { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useTeacherAvailabilityStore } from "@/frontend/common/stores/teacherAvailabilityStore";
import { availabilitySearchResolver } from "@/frontend/common/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type {
  AvailabilitySearchFormData,
  TeacherAvailabilityInsights,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { TeacherAvailabilityViewModel } from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import {
  MobileExportButton,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { AvailabilitySearchFormMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/availabilitySearchForm.mobile";
import { WeeklyAvailabilityGridMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.mobile";

interface TeacherAvailabilityMobileViewProps extends Omit<TeacherAvailabilityViewModel, "insights"> {
  readonly insights?: TeacherAvailabilityInsights;
}

function resolveDefaultFilters(
  propFilters: AvailabilitySearchFormData,
  storeFilters: { readonly fromTime: Date | null; readonly toTime: Date | null; readonly gender: Gender | null }
): AvailabilitySearchFormData {
  const storeHasDraft = storeFilters.fromTime !== null || storeFilters.toTime !== null || storeFilters.gender !== null;
  return storeHasDraft ? storeFilters : propFilters;
}

export function TeacherAvailabilityMobileView({
  labelsBySection,
  availability,
  defaultFilters,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
}: Readonly<TeacherAvailabilityMobileViewProps>) {
  const { shell: labels, table: tableLabels } = labelsBySection;
  const storeFilters = useTeacherAvailabilityStore(
    (state: { readonly filters: AvailabilitySearchFormData }) => state.filters
  );

  const methods = useForm<AvailabilitySearchFormData>({
    resolver: availabilitySearchResolver,
    defaultValues: resolveDefaultFilters(defaultFilters, storeFilters),
  });

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.mobile.pageTitle}
        subtitle={labels.mobile.pageSubtitle}
        breadcrumbs={[
          { label: labels.breadcrumbs.teachers, href: "/teachers" },
          { label: labels.breadcrumbs.availability, current: true },
        ]}
        actions={<MobileExportButton onClick={onExportPdf}>{labels.exportPdf}</MobileExportButton>}
      />

      <Box sx={{ mb: 2 }}>
        <MobileSectionPanel title={labels.searchTitle} edgeToEdge>
          <FormProvider {...methods}>
            <AvailabilitySearchFormMobile
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
        </MobileSectionPanel>
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
