// cspell:disable
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { ExportButton } from "@/frontend/components/ui/ActionButtons";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import { SectionPanel } from "@/frontend/components/ui/SectionPanel";
import type { TeacherAvailabilityInsights, WeeklyAvailability } from "@/frontend/stores/teacherAvailabilityStore";
import { AvailabilityInsights } from "./components/AvailabilityInsights";
import { AvailabilitySearchForm } from "./components/AvailabilitySearchForm";
import { WeeklyAvailabilityGrid } from "./components/WeeklyAvailabilityGrid";
import { type AvailabilitySearchFormData, availabilitySearchSchema } from "./schemas/availabilitySearchSchema";

interface TeacherAvailabilityViewProps {
  readonly availability: WeeklyAvailability;
  readonly insights: TeacherAvailabilityInsights;
  readonly defaultFilters: AvailabilitySearchFormData;
}

export function TeacherAvailabilityView({
  availability,
  insights,
  defaultFilters,
}: Readonly<TeacherAvailabilityViewProps>) {
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
        actions={<ExportButton>{t("exportPdf")}</ExportButton>}
      />

      <Box sx={{ mb: 4 }}>
        <SectionPanel title={t("searchTitle")}>
          <FormProvider {...methods}>
            <AvailabilitySearchForm />
          </FormProvider>
        </SectionPanel>
      </Box>

      <WeeklyAvailabilityGrid availability={availability} labels={tableLabels} />

      {!isMobile && <AvailabilityInsights insights={insights} />}
    </PageContainer>
  );
}
