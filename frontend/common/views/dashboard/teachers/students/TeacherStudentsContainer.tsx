"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
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

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { UseTeacherStudentsViewModelProps };
