"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type TeacherReassignmentViewModel,
  type UseTeacherReassignmentViewModelProps,
  useTeacherReassignmentViewModel,
} from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";

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

export function TeacherReassignmentContainer(props: Readonly<UseTeacherReassignmentViewModelProps>) {
  const viewModel = useTeacherReassignmentViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.StudentReassignTeacher, AppPermission.StudentManageStatus]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { TeacherReassignmentViewModel, UseTeacherReassignmentViewModelProps };
