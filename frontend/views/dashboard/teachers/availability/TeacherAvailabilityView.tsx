// cspell:disable
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { ExportButton } from "@/frontend/components/ui/ActionButtons";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import { SectionPanel } from "@/frontend/components/ui/SectionPanel";
import { AvailabilityInsights } from "./components/AvailabilityInsights";
import { AvailabilitySearchForm } from "./components/AvailabilitySearchForm";
import { WeeklyAvailabilityGrid } from "./components/WeeklyAvailabilityGrid";
import { availabilitySearchSchema } from "./schemas/availabilitySearchSchema";
import type { AvailabilityEntry, AvailabilitySearchFormData, TeacherAvailabilityViewProps } from "./types";

export function TeacherAvailabilityView({
  availability,
  insights,
  defaultFilters,
  loading,
  onExportPdf,
  onSearch,
  onBlockClick,
}: Readonly<
  TeacherAvailabilityViewProps & {
    onSearch?: (formData: AvailabilitySearchFormData) => void;
    onBlockClick?: (entry: AvailabilityEntry) => void;
  }
>) {
  const t = useTranslations("dashboard.teacherAvailability");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const methods = useForm<AvailabilitySearchFormData>({
    resolver: zodResolver(availabilitySearchSchema),
    defaultValues: defaultFilters,
  });

  const tableLabels = {
    time: t("table.time"),
    monday: t("table.monday"),
    tuesday: t("table.tuesday"),
    wednesday: t("table.wednesday"),
    thursday: t("table.thursday"),
    friday: t("table.friday"),
    saturday: t("table.saturday"),
    sunday: t("table.sunday"),
    mon: t("table.mon"),
    tue: t("table.tue"),
    wed: t("table.wed"),
    thu: t("table.thu"),
    fri: t("table.fri"),
    sat: t("table.sat"),
    sun: t("table.sun"),
  };

  return (
    <PageContainer>
      <PageHeader
        title={isMobile ? t("mobile.pageTitle") : t("pageTitle")}
        subtitle={isMobile ? t("mobile.pageSubtitle") : t("pageSubtitle")}
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

      {!isMobile && <AvailabilityInsights insights={insights} />}
    </PageContainer>
  );
}
