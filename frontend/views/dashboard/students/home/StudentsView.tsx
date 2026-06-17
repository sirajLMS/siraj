"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import type {
  StudentAccountStatus,
  StudentDirectoryRow,
  StudentEnrollmentStatus,
} from "@/frontend/stores/mockStudentsStore";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StudentsDesktopView } from "./StudentsDesktopView";
import { StudentsMobileView } from "./StudentsMobileView";

export interface StudentsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly mobileTitle: string;
  readonly searchPlaceholder: string;
  readonly addStudent: string;
  readonly filters: string;
  readonly globalRecord: string;
  readonly index: string;
  readonly student: string;
  readonly email: string;
  readonly status: string;
  readonly hoursPerWeek: string;
  readonly classesLeft: string;
  readonly actions: string;
  readonly showingOf: string;
  readonly previous: string;
  readonly next: string;
  readonly viewProfile: string;
  readonly viewHistory: string;
  readonly noEntries: string;
  readonly weeklyHours: string;
  readonly enrollmentStatus: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

interface StudentsViewProps {
  readonly metrics: readonly MetricItem[];
  readonly mobileMetrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRow[];
  readonly totalStudents: number;
  readonly searchQuery: string;
  readonly labels: StudentsViewLabels;
  readonly onSearchChange: (query: string) => void;
  readonly onAddStudent: () => void;
  readonly onViewProfile: (id: string) => void;
  readonly onViewHistory: (id: string) => void;
}

export function StudentsView({
  metrics,
  mobileMetrics,
  rows,
  totalStudents,
  searchQuery,
  labels,
  onSearchChange,
  onAddStudent,
  onViewProfile,
  onViewHistory,
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
        searchQuery={searchQuery}
        mobileMetrics={mobileMetrics}
        rows={rows}
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
      totalStudents={totalStudents}
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
      onViewProfile={onViewProfile}
      onViewHistory={onViewHistory}
    />
  );
}
