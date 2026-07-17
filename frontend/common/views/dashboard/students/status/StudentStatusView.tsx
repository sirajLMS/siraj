"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentStatusViewModel,
  type UseStudentStatusViewModelProps,
  useStudentStatusViewModel,
} from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";

export type { StudentStatusViewModel };

const lazyViews = createLazyView<StudentStatusViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/status/studentStatus.mobile").then(m => ({
      default: m.StudentStatusMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/status/studentStatus.desktop").then(m => ({
      default: m.StudentStatusDesktopView,
    }))
);

export function StudentStatusView(props: Readonly<UseStudentStatusViewModelProps>) {
  const viewModel = useStudentStatusViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
