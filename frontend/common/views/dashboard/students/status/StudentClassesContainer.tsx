"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentStatusViewModel,
  type UseStudentStatusViewModelProps,
  useStudentStatusViewModel,
} from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";

const lazyViews = createLazyView<StudentStatusViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/status/studentClasses.mobile").then(m => ({
      default: m.StudentClassesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/status/studentClasses.desktop").then(m => ({
      default: m.StudentClassesDesktopView,
    }))
);

export function StudentClassesView(props: Readonly<UseStudentStatusViewModelProps>) {
  const viewModel = useStudentStatusViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
