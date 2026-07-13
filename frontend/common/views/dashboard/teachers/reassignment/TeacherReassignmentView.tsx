"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import type {
  TeacherReassignmentViewModel,
  UseTeacherReassignmentViewModelProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { useTeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { TeacherReassignmentViewDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/teacherReassignmentView.desktop";
import { TeacherReassignmentViewMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/teacherReassignmentView.mobile";

export type { TeacherReassignmentViewModel, UseTeacherReassignmentViewModelProps };

export function TeacherReassignmentView(props: Readonly<UseTeacherReassignmentViewModelProps>) {
  const viewModel = useTeacherReassignmentViewModel(props);
  const { isMobile } = useViewport();
  return isMobile ? (
    <TeacherReassignmentViewMobile {...viewModel} />
  ) : (
    <TeacherReassignmentViewDesktop {...viewModel} />
  );
}
