"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StudentsDesktopView } from "./StudentsDesktopView";
import { StudentsMobileView } from "./StudentsMobileView";
import type { StudentDirectoryRowExtended, StudentsViewLabels } from "./types";

interface StudentsViewProps {
  readonly metrics: readonly MetricItem[];
  readonly mobileMetrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly totalStudents?: number;
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  readonly loading?: boolean;
  readonly labels: StudentsViewLabels;
  readonly onSearchChange: (query: string) => void;
  readonly onAddStudent: () => void;
  readonly onFilterClick: () => void;
  readonly onViewProfile: (id: string) => void;
  readonly onViewHistory: (id: string) => void;
  readonly onPageChange: (page: number) => void;
}

export function StudentsView({
  metrics,
  mobileMetrics,
  rows,
  totalStudents,
  searchQuery,
  page,
  pageSize,
  loading,
  labels,
  onSearchChange,
  onAddStudent,
  onFilterClick,
  onViewProfile,
  onViewHistory,
  onPageChange,
}: StudentsViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return (
      <StudentsMobileView
        pageTitle={labels.pageTitle}
        pageSubtitle={labels.pageSubtitle}
        searchPlaceholder={labels.searchPlaceholder}
        addStudentLabel={labels.addStudent}
        filtersLabel={labels.filters}
        searchQuery={searchQuery}
        mobileMetrics={mobileMetrics}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalCount={totalStudents}
        onPageChange={onPageChange}
        cardListLabels={{
          weeklyHours: labels.weeklyHours,
          enrollmentStatus: labels.enrollmentStatus,
          classesLeft: labels.classesLeft,
          viewProfile: labels.viewProfile,
          statusLabels: labels.statusLabels,
          enrollmentLabels: labels.enrollmentLabels,
        }}
        onSearchChange={onSearchChange}
        onAddStudent={onAddStudent}
        onFilterClick={onFilterClick}
        onViewProfile={onViewProfile}
      />
    );
  }

  return (
    <StudentsDesktopView
      pageTitle={labels.pageTitle}
      pageSubtitle={labels.pageSubtitle}
      globalRecord={labels.globalRecord}
      addStudentLabel={labels.addStudent}
      filtersLabel={labels.filters}
      metrics={metrics}
      rows={rows}
      loading={loading}
      totalStudents={totalStudents}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      tableLabels={{
        index: labels.index,
        student: labels.student,
        email: labels.email,
        status: labels.status,
        hoursPerWeek: labels.hoursPerWeek,
        classesLeft: labels.classesLeft,
        actions: labels.actions,
        showingOf: labels.showingOf,
        previous: labels.previous,
        next: labels.next,
        viewProfile: labels.viewProfile,
        viewHistory: labels.viewHistory,
        noEntries: labels.noEntries,
        statusLabels: labels.statusLabels,
      }}
      onAddStudent={onAddStudent}
      onFilterClick={onFilterClick}
      onViewProfile={onViewProfile}
      onViewHistory={onViewHistory}
    />
  );
}
