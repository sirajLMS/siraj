"use client";

import { FormProvider } from "react-hook-form";
import type { TeacherAvailabilityViewModel } from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";
import { DesktopExportButton, DesktopLoadingState, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { AvailabilityInsightsDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilityInsights.desktop";
import { AvailabilitySearchFormDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/availabilitySearchForm.desktop";
import { WeeklyAvailabilityGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.desktop";

export function TeacherAvailabilityDesktopView({
  labelsBySection,
  availability,
  insights,
  formMethods,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
}: Readonly<TeacherAvailabilityViewModel>) {
  const { shell: labels, table: tableLabels } = labelsBySection;

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

      <DesktopSectionPanel title={labels.searchTitle}>
        <FormProvider {...formMethods}>
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

      {loading && <DesktopLoadingState />}

      {!loading && (
        <WeeklyAvailabilityGridDesktop availability={availability} labels={tableLabels} onBlockClick={onBlockClick} />
      )}

      <AvailabilityInsightsDesktop insights={insights} labels={labels.insights} />
    </DesktopPageContainer>
  );
}
