"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MetricCardGrid } from "@/frontend/common/components/reports/MetricCardGrid";
import {
  FilterButton,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentDirectoryDataGrid } from "@/frontend/common/views/dashboard/admin/parents/students/components/StudentDirectoryDataGrid";
import type { StudentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel";

export function StudentsDesktopView({
  labels,
  metrics,
  rows,
  totalStudents,
  loading,
  page,
  pageSize,
  onPageChange,
  onAddStudent,
  onFilterClick,
  onViewProfile,
  onViewHistory,
}: Readonly<StudentsViewModel>) {
  const tableLabels = {
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
  };

  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <MetricCardGrid metrics={metrics} size={{ md: 6, lg: "grow" }} />

      <SectionPanel
        title={labels.globalRecord}
        actions={
          <>
            <RequirePermission permissions={[AppPermission.StudentsCreate]}>
              <PrimaryPageAction id="students-add-btn" startIcon={<AddOutlined />} onClick={onAddStudent}>
                {labels.addStudent}
              </PrimaryPageAction>
            </RequirePermission>
            <FilterButton id="students-filters-btn" startIcon={<FilterListOutlined />} onClick={onFilterClick}>
              {labels.filters}
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
          loading={loading}
        />
      </SectionPanel>
    </PageContainer>
  );
}
