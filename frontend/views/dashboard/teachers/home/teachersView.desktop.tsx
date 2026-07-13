"use client";

import { EditCalendarOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import { PrimaryPageAction } from "@/frontend/common/components/ui/button/ActionButtons";
import type {
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherDataGrid } from "@/frontend/views/dashboard/teachers/home/components/TeacherDataGrid";
import { TeacherMetricsRow } from "@/frontend/views/dashboard/teachers/home/components/TeacherMetricsRow";
import { Link } from "@/shared/i18n/routing";

export interface TeachersDesktopViewProps {
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

/**
 * Desktop variant of the Teachers directory view.
 *
 * Tier-specific presentation component — receives a fully-resolved view model
 * via props. Must NEVER import `useMediaQuery` or `useViewport` (viewport tier
 * is decided by the parent switcher `TeachersView.tsx`).
 */
export function TeachersDesktopView({
  metrics,
  rows,
  totalTeachers,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<TeachersDesktopViewProps>) {
  const t = useTranslations("dashboard.teachersDirectory");

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        actions={
          <>
            <RequirePermission permissions={[AppPermission.TeachersCreate]}>
              <Link href="/teachers/onboarding" style={{ textDecoration: "none" }}>
                <PrimaryPageAction startIcon={<PersonAddOutlined />}>{t("actions.addTeacher")}</PrimaryPageAction>
              </Link>
            </RequirePermission>
            <PrimaryPageAction startIcon={<EditCalendarOutlined />}>{t("actions.updateSchedules")}</PrimaryPageAction>
          </>
        }
      />

      <Box sx={{ mb: 4 }}>
        <TeacherMetricsRow metrics={metrics} />
      </Box>

      <SectionPanel title={t("table.showingOf", { count: rows.length, total: totalTeachers })}>
        <TeacherDataGrid
          rows={rows}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      </SectionPanel>
    </PageContainer>
  );
}
