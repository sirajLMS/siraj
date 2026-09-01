"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherClassListViewModel,
  type UseTeacherClassListViewModelProps,
  useTeacherClassListViewModel,
} from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";

export type { UseTeacherClassListViewModelProps };

const lazyViews = createLazyView<TeacherClassListViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/classes/teacherClassListView.mobile").then(m => ({
      default: m.TeacherClassListMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/classes/teacherClassListView.desktop").then(m => ({
      default: m.TeacherClassListDesktopView,
    }))
);

export function TeacherClassListContainer(props: Readonly<UseTeacherClassListViewModelProps> = {}) {
  const viewModel = useTeacherClassListViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
