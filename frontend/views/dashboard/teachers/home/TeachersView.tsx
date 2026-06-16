"use client";

import { EditCalendarOutlined } from "@mui/icons-material";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PrimaryPageAction } from "@/frontend/components/ui/ActionButtons";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import { SectionPanel } from "@/frontend/components/ui/SectionPanel";
import type { TeacherDirectoryRow, TeacherMetrics } from "@/frontend/stores/teachersStore";
import { TeacherCardList } from "./components/TeacherCardList";
import { TeacherDataGrid } from "./components/TeacherDataGrid";
import { TeacherMetricsRow } from "./components/TeacherMetricsRow";

interface TeachersViewProps {
  readonly metrics: TeacherMetrics;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}

export function TeachersView({
  metrics,
  rows,
  totalTeachers,
  searchQuery,
  onSearchChange,
}: Readonly<TeachersViewProps>) {
  const t = useTranslations("dashboard.teachersDirectory");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const filteredRows = rows.filter(
    row =>
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        actions={
          <PrimaryPageAction startIcon={<EditCalendarOutlined />}>{t("actions.updateSchedules")}</PrimaryPageAction>
        }
      />

      <Box sx={{ mb: 4 }}>
        <TeacherMetricsRow metrics={metrics} />
      </Box>

      {isMobile ? (
        <TeacherCardList rows={filteredRows} searchQuery={searchQuery} onSearchChange={onSearchChange} />
      ) : (
        <SectionPanel title={t("table.showingOf", { count: filteredRows.length, total: totalTeachers })}>
          <TeacherDataGrid rows={filteredRows} />
        </SectionPanel>
      )}
    </PageContainer>
  );
}
