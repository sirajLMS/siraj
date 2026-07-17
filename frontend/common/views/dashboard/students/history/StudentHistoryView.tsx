"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentHistoryViewModel,
  useStudentHistoryViewModel,
} from "@/frontend/common/views/dashboard/students/history/useStudentHistoryViewModel";

export type { StudentHistoryViewModel };

const lazyViews = createLazyView<StudentHistoryViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/history/studentHistory.mobile").then(m => ({
      default: m.StudentHistoryMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/history/studentHistory.desktop").then(m => ({
      default: m.StudentHistoryDesktopView,
    }))
);

export function StudentHistoryView(props: Readonly<StudentHistoryViewModel>) {
  const viewModel = useStudentHistoryViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
