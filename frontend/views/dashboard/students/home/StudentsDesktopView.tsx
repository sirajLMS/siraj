"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { FilterButton, PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StudentDirectoryDataGrid } from "./components/StudentDirectoryDataGrid";
import type { StudentAccountStatus, StudentDirectoryRowExtended } from "./types";

interface StudentsDesktopViewProps {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly globalRecord: string;
  readonly addStudentLabel: string;
  readonly filtersLabel: string;
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly totalStudents: number; //NOSONAR
  readonly tableLabels: {
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
    readonly statusLabels: Record<StudentAccountStatus, string>;
  };
  readonly onAddStudent: () => void;
  readonly onViewProfile: (id: string) => void;
  readonly onViewHistory: (id: string) => void;
}

export function StudentsDesktopView({
  pageTitle,
  pageSubtitle,
  globalRecord,
  addStudentLabel,
  filtersLabel,
  metrics,
  rows,
  tableLabels,
  onAddStudent,
  onViewProfile,
  onViewHistory,
}: StudentsDesktopViewProps) {
  return (
    <PageContainer>
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />

      <MetricCardGrid metrics={metrics} size={{ md: 6, lg: "grow" }} />

      <SectionPanel
        title={globalRecord}
        actions={
          <>
            <PrimaryPageAction id="students-add-btn" startIcon={<AddOutlined />} onClick={onAddStudent}>
              {addStudentLabel}
            </PrimaryPageAction>
            <FilterButton id="students-filters-btn" startIcon={<FilterListOutlined />}>
              {filtersLabel}
            </FilterButton>
          </>
        }
      >
        <StudentDirectoryDataGrid
          rows={rows}
          labels={tableLabels}
          onViewProfile={onViewProfile}
          onViewHistory={onViewHistory}
        />
      </SectionPanel>
    </PageContainer>
  );
}
