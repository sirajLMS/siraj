"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { FilterButton, PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StudentDirectoryDataGrid } from "./components/StudentDirectoryDataGrid";
import type { StudentDirectoryDataGridLabels, StudentDirectoryRowExtended } from "./types";

interface StudentsDesktopViewProps {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly globalRecord: string;
  readonly addStudentLabel: string;
  readonly filtersLabel: string;
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly totalStudents: number;
  readonly page?: number;
  readonly pageSize?: number;
  readonly onPageChange?: (page: number) => void;
  readonly tableLabels: StudentDirectoryDataGridLabels;
  readonly onAddStudent: () => void;
  readonly onFilterClick: () => void;
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
  totalStudents,
  page,
  pageSize,
  onPageChange,
  tableLabels,
  onAddStudent,
  onFilterClick,
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
            <RequirePermission permissions={[AppPermission.StudentsCreate]}>
              <PrimaryPageAction id="students-add-btn" startIcon={<AddOutlined />} onClick={onAddStudent}>
                {addStudentLabel}
              </PrimaryPageAction>
            </RequirePermission>
            <FilterButton id="students-filters-btn" startIcon={<FilterListOutlined />} onClick={onFilterClick}>
              {filtersLabel}
            </FilterButton>
          </>
        }
      >
        <StudentDirectoryDataGrid
          rows={rows}
          labels={tableLabels}
          page={page}
          pageSize={pageSize}
          totalCount={totalStudents}
          onPageChange={onPageChange}
          onViewProfile={onViewProfile}
          onViewHistory={onViewHistory}
        />
      </SectionPanel>
    </PageContainer>
  );
}
