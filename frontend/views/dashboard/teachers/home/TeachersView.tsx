"use client";

import { EditCalendarOutlined } from "@mui/icons-material";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PrimaryPageAction } from "@/frontend/components/ui/ActionButtons";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import { SectionPanel } from "@/frontend/components/ui/SectionPanel";
import type { TeacherDirectoryMetrics, TeacherDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { TeacherCardList } from "./components/TeacherCardList";
import { TeacherDataGrid } from "./components/TeacherDataGrid";
import { TeacherMetricsRow } from "./components/TeacherMetricsRow";

interface TeachersViewProps {
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

export function TeachersView({
  metrics,
  rows,
  totalTeachers,
  searchQuery,
  onSearchChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<TeachersViewProps>) {
  const t = useTranslations("dashboard.teachersDirectory");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
        <TeacherCardList
          rows={rows}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      ) : (
        <SectionPanel title={t("table.showingOf", { count: rows.length, total: totalTeachers })}>
          <TeacherDataGrid
            rows={rows}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </SectionPanel>
      )}
    </PageContainer>
  );
}
