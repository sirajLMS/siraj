"use client";

import { FormProvider } from "react-hook-form";
import type { TeacherAvailabilityViewModel } from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import {
  MobileExportButton,
  MobileLoadingState,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { AvailabilitySearchFormMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/availabilitySearchForm.mobile";
import { WeeklyAvailabilityGridMobile } from "@/frontend/mobile/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.mobile";

export function TeacherAvailabilityMobileView({
  labelsBySection,
  availability,
  formMethods,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
}: Readonly<TeacherAvailabilityViewModel>) {
  const { shell: labels, table: tableLabels } = labelsBySection;

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

      <MobileSectionPanel title={labels.searchTitle} edgeToEdge>
        <FormProvider {...formMethods}>
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

      {loading && <MobileLoadingState />}

      {!loading && (
        <WeeklyAvailabilityGridMobile availability={availability} labels={tableLabels} onBlockClick={onBlockClick} />
      )}
    </MobilePageContainer>
  );
}
