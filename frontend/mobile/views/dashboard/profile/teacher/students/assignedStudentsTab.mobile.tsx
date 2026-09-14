"use client";

import { AssignedStudentsTabShared } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabShared";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import type { AssignedStudentsTabSlotProps } from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsTabShared.types";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import { AssignedStudentsCardList } from "@/frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsCardList.mobile";

const ClassFilterWrapper: Required<AssignedStudentsTabSlotProps>["ClassFilterWrapper"] = ({ children }) => (
  <MobileHorizontalScrollRow>{children}</MobileHorizontalScrollRow>
);

const ListView: AssignedStudentsTabSlotProps["ListView"] = ({ rows, pagination, labelsBySection }) => (
  <AssignedStudentsCardList
    rows={rows}
    labels={{
      columns: labelsBySection.columns,
      emptyMessage: labelsBySection.list.mobileEmptyMessage,
    }}
    paginationOptions={pagination}
  />
);

export function AssignedStudentsTabMobileView({ ...viewModel }: Readonly<AssignedStudentsTabViewModel>) {
  return <AssignedStudentsTabShared viewModel={viewModel} slots={{ ListView, ClassFilterWrapper }} />;
}
