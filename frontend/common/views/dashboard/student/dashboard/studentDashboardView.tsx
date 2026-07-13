"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentDashboardViewModel,
  type UseStudentDashboardViewModelProps,
  useStudentDashboardViewModel,
} from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";

export type { StudentDashboardViewModel };

const lazyViews = createLazyView<StudentDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/dashboard/studentDashboard.mobile").then(m => ({
      default: m.StudentDashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/dashboard/studentDashboard.desktop").then(m => ({
      default: m.StudentDashboardDesktopView,
    }))
);

export function StudentDashboardView(props: Readonly<UseStudentDashboardViewModelProps>) {
  const viewModel = useStudentDashboardViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
