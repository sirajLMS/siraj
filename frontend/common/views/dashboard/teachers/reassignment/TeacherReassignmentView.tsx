// cspell:disable
"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherReassignmentViewModel,
  type UseTeacherReassignmentViewModelProps,
  useTeacherReassignmentViewModel,
} from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";

export type { TeacherReassignmentViewModel, UseTeacherReassignmentViewModelProps };

const lazyViews = createLazyView<TeacherReassignmentViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/reassignment/teacherReassignmentView.mobile").then(m => ({
      default: m.TeacherReassignmentViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/reassignment/teacherReassignmentView.desktop").then(m => ({
      default: m.TeacherReassignmentViewDesktop,
    }))
);

export function TeacherReassignmentView(props: Readonly<UseTeacherReassignmentViewModelProps>) {
  const viewModel = useTeacherReassignmentViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
