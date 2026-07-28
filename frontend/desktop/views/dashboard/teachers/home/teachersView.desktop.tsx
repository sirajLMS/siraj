"use client";

import { EditCalendarOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type {
  TeacherDirectoryMetrics,
  TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { TeacherDataGrid } from "@/frontend/desktop/views/dashboard/teachers/home/components/teacherDataGrid.desktop";
import { TeacherMetricsRow } from "@/frontend/desktop/views/dashboard/teachers/home/components/teacherMetricsRow.desktop";
import { Link } from "@/shared/i18n";
import { useAppTranslation } from "@/shared/locale";

export interface TeachersDesktopViewProps {
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly canCreateTeacher: boolean;
  readonly onNavigateToSchedule: (teacherId: string) => void;
  readonly onNavigateToProfile: (teacher: TeacherDirectoryRow) => void;
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
  canCreateTeacher,
  onNavigateToSchedule,
  onNavigateToProfile,
}: Readonly<TeachersDesktopViewProps>) {
  const t = useAppTranslation().dashboardTranslations.teachersDirectory;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <>
            {canCreateTeacher ? (
              <Link href="/teachers/onboarding" style={{ textDecoration: "none" }}>
                <DesktopPrimaryPageAction startIcon={<PersonAddOutlined />}>
                  {t.actions.addTeacher}
                </DesktopPrimaryPageAction>
              </Link>
            ) : null}
            <DesktopPrimaryPageAction startIcon={<EditCalendarOutlined />}>
              {t.actions.updateSchedules}
            </DesktopPrimaryPageAction>
          </>
        }
      />

      <Box sx={{ mb: 4 }}>
        <TeacherMetricsRow metrics={metrics} />
      </Box>

      <DesktopSectionPanel title={t.table.showingOf(rows.length, totalTeachers)}>
        <TeacherDataGrid
          rows={rows}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onNavigateToSchedule={onNavigateToSchedule}
          onNavigateToProfile={onNavigateToProfile}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}

export default TeachersDesktopView;
