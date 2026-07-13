"use client";

import type { TeacherDirectoryMetrics, TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { TeachersDesktopView } from "@/frontend/views/dashboard/teachers/home/teachersView.desktop";
import { TeachersMobileView } from "@/frontend/views/dashboard/teachers/home/teachersView.mobile";

export interface TeachersViewProps {
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

/**
 * Switcher for the Teachers directory view.
 *
 * This is the ONLY file in this domain that reads the viewport tier. The
 * Container component (`TeachersContainer.tsx`) continues to call
 * `<TeachersView {...} />` with the same props interface. The switcher partitions
 * the props between the mobile and desktop tier-specific components (mobile
 * surfaces search + card-list pagination; desktop surfaces totalTeachers in the
 * SectionPanel header alongside the data grid pagination).
 */
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
  const { isMobile } = useViewport();

  if (isMobile) {
    return (
      <TeachersMobileView
        metrics={metrics}
        rows={rows}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    );
  }

  return (
    <TeachersDesktopView
      metrics={metrics}
      rows={rows}
      totalTeachers={totalTeachers}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
    />
  );
}
