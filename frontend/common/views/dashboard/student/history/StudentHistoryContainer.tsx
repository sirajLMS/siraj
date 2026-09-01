"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentHistoryViewModel,
  useStudentHistoryViewModel,
} from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";

const lazyViews = createLazyView<StudentHistoryViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/history/studentHistory.mobile").then(m => ({
      default: m.StudentHistoryMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/history/studentHistory.desktop").then(m => ({
      default: m.StudentHistoryDesktopView,
    }))
);

export function StudentHistoryView() {
  const viewModel = useStudentHistoryViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
