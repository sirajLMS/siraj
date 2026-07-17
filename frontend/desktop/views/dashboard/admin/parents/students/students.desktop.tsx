"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StudentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel";
import {
  DesktopFilterButton,
  DesktopMetricCardGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { StudentDirectoryDataGrid } from "@/frontend/desktop/views/dashboard/admin/parents/students/components/studentDirectoryDataGrid.desktop";

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
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <DesktopMetricCardGrid metrics={metrics} size={{ md: 6, lg: "grow" }} />

      <DesktopSectionPanel
        title={labels.globalRecord}
        actions={
          <>
            <RequirePermission permissions={[AppPermission.StudentsCreate]}>
              <DesktopPrimaryPageAction id="students-add-btn" startIcon={<AddOutlined />} onClick={onAddStudent}>
                {labels.addStudent}
              </DesktopPrimaryPageAction>
            </RequirePermission>
            <DesktopFilterButton id="students-filters-btn" startIcon={<FilterListOutlined />} onClick={onFilterClick}>
              {labels.filters}
            </DesktopFilterButton>
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
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
