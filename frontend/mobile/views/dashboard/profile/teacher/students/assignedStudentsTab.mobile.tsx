"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { AssignedStudentsTabShared } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabShared";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import type { AssignedStudentsTabSlotProps } from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsTabShared.types";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import { AssignedStudentsCardList } from "@/frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsCardList.mobile";

const ClassFilterWrapper: Required<AssignedStudentsTabSlotProps>["ClassFilterWrapper"] = ({ children }) => (
  <MobileHorizontalScrollRow>{children}</MobileHorizontalScrollRow>
);

const ListView: AssignedStudentsTabSlotProps["ListView"] = ({ rows, pagination, labelsBySection }) => {
  const pagedRows = rows.slice(pagination.page * pagination.pageSize, (pagination.page + 1) * pagination.pageSize);

  return (
    <AssignedStudentsCardList
      rows={pagedRows}
      labels={{
        columns: labelsBySection.columns,
        emptyMessage: labelsBySection.list.mobileEmptyMessage,
      }}
      paginationOptions={buildServerPaginationOptions({
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount: pagination.totalCount,
        onPageChange: pagination.onPageChange,
      })}
    />
  );
};

export function AssignedStudentsTabMobileView({ ...viewModel }: Readonly<AssignedStudentsTabViewModel>) {
  return <AssignedStudentsTabShared viewModel={viewModel} slots={{ ListView, ClassFilterWrapper }} />;
}
