"use client";

import { AssignedStudentsTabShared } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabShared";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import type { AssignedStudentsTabSlotProps } from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsTabShared.types";
import { AssignedStudentsDataGrid } from "@/frontend/desktop/views/dashboard/profile/teacher/students/assignedStudentsDataGrid.desktop";

const ListView: AssignedStudentsTabSlotProps["ListView"] = ({ rows, loading, pagination }) => (
  <AssignedStudentsDataGrid
    rows={rows}
    loading={loading}
    page={pagination.page}
    pageSize={pagination.pageSize}
    onPaginationModelChange={model => {
      pagination.onPaginationModelChange(model.page, model.pageSize);
    }}
  />
);

export function AssignedStudentsTabDesktopView({ ...viewModel }: Readonly<AssignedStudentsTabViewModel>) {
  return <AssignedStudentsTabShared viewModel={viewModel} slots={{ ListView }} />;
}
