"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type TeacherStudentsViewModel,
  type UseTeacherStudentsViewModelProps,
  useTeacherStudentsViewModel,
} from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";

const lazyViews = createLazyView<TeacherStudentsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/students/teacherStudentsView.mobile").then(m => ({
      default: m.TeacherStudentsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/students/teacherStudentsView.desktop").then(m => ({
      default: m.TeacherStudentsDesktopView,
    }))
);

export function TeacherStudentsContainer(props: Readonly<UseTeacherStudentsViewModelProps> = {}) {
  const viewModel = useTeacherStudentsViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.TeacherViewStudents]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { TeacherStudentsViewModel, UseTeacherStudentsViewModelProps };
