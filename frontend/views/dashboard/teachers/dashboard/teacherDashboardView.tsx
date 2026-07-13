"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherDashboardViewModel,
  type UseTeacherDashboardViewModelProps,
  useTeacherDashboardViewModel,
} from "@/frontend/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";

export type { TeacherDashboardViewModel };

const lazyViews = createLazyView<TeacherDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile").then(m => ({
      default: m.TeacherDashboardMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/teachers/dashboard/desktop/teacherDashboard.desktop").then(m => ({
      default: m.TeacherDashboardDesktopView,
    }))
);

export function TeacherDashboardView(props: Readonly<UseTeacherDashboardViewModelProps>) {
  const viewModel = useTeacherDashboardViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
