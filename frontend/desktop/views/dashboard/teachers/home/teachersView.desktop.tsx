"use client";

import { EditCalendarOutlined, PersonAddOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type {
  TeacherDirectoryQuery_teacherDirectory_metrics as TeacherDirectoryMetrics,
  TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { TeacherDataGrid } from "@/frontend/desktop/views/dashboard/teachers/home/components/teacherDataGrid.desktop";
import { TeacherMetricsRow } from "@/frontend/desktop/views/dashboard/teachers/home/components/teacherMetricsRow.desktop";
import { Link } from "@/shared/i18n";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

export interface TeachersDesktopViewProps {
  readonly labels: TeachersDirectoryLabels;
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly totalTeachers: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly canCreateTeacher: boolean;
}

/**
 * Desktop variant of the Teachers directory view.
 *
 * Tier-specific presentation component — receives a fully-resolved view model
 * via props. Must NEVER import `useMediaQuery` or `useViewport` (viewport tier
 * is decided by the parent switcher `TeachersView.tsx`).
 */
export function TeachersDesktopView({
  labels,
  metrics,
  rows,
  totalTeachers,
  page,
  pageSize,
  totalCount,
  onPageChange,
  canCreateTeacher,
}: Readonly<TeachersDesktopViewProps>) {
  const t = labels;

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
        <TeacherMetricsRow metrics={metrics} labels={labels.metrics} />
      </Box>

      <DesktopSectionPanel contentPadding={false} title={t.table.showingOf(rows.length, totalTeachers)}>
        <TeacherDataGrid
          rows={rows}
          labels={labels}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}

export default TeachersDesktopView;
