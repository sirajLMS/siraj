// cspell:disable
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress } from "@mui/material";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { ExportButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { useTeacherAvailabilityStore } from "@/frontend/common/stores/teacherAvailabilityStore";
import { AvailabilityInsights } from "@/frontend/views/dashboard/teachers/availability/components/AvailabilityInsights";
import { AvailabilitySearchForm } from "@/frontend/views/dashboard/teachers/availability/components/AvailabilitySearchForm";
import { WeeklyAvailabilityGrid } from "@/frontend/views/dashboard/teachers/availability/components/WeeklyAvailabilityGrid";
import { availabilitySearchSchema } from "@/frontend/views/dashboard/teachers/availability/schemas/availabilitySearchSchema";
import type { AvailabilitySearchFormData } from "@/frontend/views/dashboard/teachers/availability/types";
import type { TeacherAvailabilityViewModel } from "@/frontend/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";

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
  const t = useTranslations("dashboard.teacherAvailability");
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
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[
          { label: t("breadcrumbs.teachers"), href: "/teachers" },
          { label: t("breadcrumbs.availability"), current: true },
        ]}
        actions={<ExportButton onClick={onExportPdf}>{t("exportPdf")}</ExportButton>}
      />

      <Box sx={{ mb: 4 }}>
        <SectionPanel title={t("searchTitle")}>
          <FormProvider {...methods}>
            <AvailabilitySearchForm onSearch={onSearch} />
          </FormProvider>
        </SectionPanel>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <WeeklyAvailabilityGrid availability={availability} labels={tableLabels} onBlockClick={onBlockClick} />
      )}

      <AvailabilityInsights insights={insights} />
    </PageContainer>
  );
}
