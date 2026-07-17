"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentStudentsViewModel,
  type UseParentStudentsViewModelProps,
  useParentStudentsViewModel,
} from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";

export type { ParentStudentsViewModel };

const lazyViews = createLazyView<ParentStudentsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/parent/students/parentStudents.mobile").then(m => ({
      default: m.ParentStudentsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parent/students/parentStudents.desktop").then(m => ({
      default: m.ParentStudentsDesktopView,
    }))
);

export function ParentStudentsView(props: Readonly<UseParentStudentsViewModelProps>) {
  const viewModel = useParentStudentsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
