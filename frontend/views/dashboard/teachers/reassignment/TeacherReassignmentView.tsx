"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { TeacherReassignmentViewMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/teacherReassignmentView.mobile";
import { TeacherReassignmentViewDesktop } from "@/frontend/views/dashboard/teachers/reassignment/teacherReassignmentView.desktop";
import type {
  TeacherReassignmentViewModel,
  UseTeacherReassignmentViewModelProps,
} from "@/frontend/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { useTeacherReassignmentViewModel } from "@/frontend/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";

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
