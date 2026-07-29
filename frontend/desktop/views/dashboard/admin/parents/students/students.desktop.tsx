"use client";

import { AddOutlined, FilterListOutlined } from "@mui/icons-material";
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
  labelsBySection,
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
  // NEW FOR PLAN v5: lifted permission boolean consumed by the tier view
  // instead of a `RequirePermission` wrapper.
  canStudentsCreate,
}: Readonly<StudentsViewModel>) {
  const { shell, actions, columns } = labelsBySection;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={shell.pageTitle} subtitle={shell.pageSubtitle} />

      <DesktopMetricCardGrid metrics={metrics} size={{ md: 6, lg: "grow" }} />

      <DesktopSectionPanel
        contentPadding={false}
        title={shell.globalRecord}
        actions={
          <>
            {canStudentsCreate ? (
              <DesktopPrimaryPageAction id="students-add-btn" startIcon={<AddOutlined />} onClick={onAddStudent}>
                {actions.addStudent}
              </DesktopPrimaryPageAction>
            ) : null}
            <DesktopFilterButton id="students-filters-btn" startIcon={<FilterListOutlined />} onClick={onFilterClick}>
              {labelsBySection.filters.filters}
            </DesktopFilterButton>
          </>
        }
      >
        <StudentDirectoryDataGrid
          rows={rows}
          labels={columns}
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
