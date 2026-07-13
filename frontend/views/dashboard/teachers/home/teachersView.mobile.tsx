"use client";

import { EditCalendarOutlined, PersonAddOutlined } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MobileContentStack, MobilePageHeader, PageContainer, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { TeacherDirectoryMetrics, TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherCardList } from "@/frontend/views/dashboard/teachers/home/components/TeacherCardList";
import { TeacherMetricsRow } from "@/frontend/views/dashboard/teachers/home/components/TeacherMetricsRow";
import { Link } from "@/shared/i18n/routing";

export interface TeachersMobileViewProps {
  readonly metrics: TeacherDirectoryMetrics | null | undefined;
  readonly rows: readonly TeacherDirectoryRow[];
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

/**
 * Mobile variant of the Teachers directory view.
 *
 * Tier-specific presentation component — receives a fully-resolved view model
 * via props. Must NEVER import `useMediaQuery` or `useViewport` (viewport tier
 * is decided by the parent switcher `TeachersView.tsx`).
 */
export function TeachersMobileView({
  metrics,
  rows,
  searchQuery,
  onSearchChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<TeachersMobileViewProps>) {
  const t = useTranslations("dashboard.teachersDirectory");

  return (
    <PageContainer>
      <MobilePageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        edgeToEdge={false}
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

      <MobileContentStack gap={3} paddingBottom={4}>
        <TeacherMetricsRow metrics={metrics} />

        <TeacherCardList
          rows={rows}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      </MobileContentStack>
    </PageContainer>
  );
}
