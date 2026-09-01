"use client";

import { EditCalendarOutlined, PersonAddOutlined } from "@mui/icons-material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  TeacherDirectoryQuery_teacherDirectory_metrics as TeacherDirectoryMetrics,
  TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
} from "@/frontend/mobile/components/ui";
import { TeacherCardList } from "@/frontend/mobile/views/dashboard/teachers/home/components/teacherCardList.mobile";
import { TeacherMetricsRow } from "@/frontend/mobile/views/dashboard/teachers/home/components/teacherMetricsRow.mobile";
import { Link } from "@/shared/i18n";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

export interface TeachersMobileViewProps {
  readonly labels: TeachersDirectoryLabels;
  // VARIANT JUSTIFICATION: extra fields searchQuery / onSearchChange (mobile-only search-input lives on the card list header; the desktop twin surfaces search via the data-grid toolbar).
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly totalTeachers: number;
  readonly canCreateTeacher: boolean;
}

/**
 * Mobile variant of the Teachers directory view.
 *
 * Tier-specific presentation component — receives a fully-resolved view model
 * via props. Must NEVER import `useMediaQuery` or `useViewport` (viewport tier
 * is decided by the parent switcher `TeachersView.tsx`).
 */
export function TeachersMobileView({
  labels,
  metrics,
  rows,
  searchQuery,
  onSearchChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
  canCreateTeacher,
}: Readonly<TeachersMobileViewProps>) {
  const t = labels;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        edgeToEdge={false}
        actions={
          <>
            {canCreateTeacher ? (
              <Link href="/teachers/onboarding" style={{ textDecoration: "none" }}>
                <MobilePrimaryPageAction startIcon={<PersonAddOutlined />}>
                  {t.actions.addTeacher}
                </MobilePrimaryPageAction>
              </Link>
            ) : null}
            <MobilePrimaryPageAction variant="outlined" startIcon={<EditCalendarOutlined />}>
              {t.actions.updateSchedules}
            </MobilePrimaryPageAction>
          </>
        }
      />

      <MobileContentStack gap={3} paddingBottom={4}>
        <TeacherMetricsRow metrics={metrics} labels={labels.metrics} />

        <TeacherCardList
          rows={rows}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          labels={labels}
          paginationOptions={buildServerPaginationOptions({
            page,
            pageSize,
            totalCount,
            onPageChange,
          })}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
