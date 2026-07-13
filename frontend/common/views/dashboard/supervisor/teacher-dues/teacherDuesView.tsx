"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherDuesViewModel,
  type UseTeacherDuesViewModelProps,
  useTeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";

export type { TeacherDuesViewModel };

const lazyViews = createLazyView<TeacherDuesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/teacher-dues/teacherDues.mobile").then(m => ({
      default: m.TeacherDuesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.desktop").then(m => ({
      default: m.TeacherDuesDesktopView,
    }))
);

export function TeacherDuesView(props: Readonly<UseTeacherDuesViewModelProps>) {
  const viewModel = useTeacherDuesViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
