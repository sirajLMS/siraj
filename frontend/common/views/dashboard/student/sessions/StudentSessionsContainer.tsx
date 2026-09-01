"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentSessionsViewModel,
  useStudentSessionsViewModel,
} from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";

const lazyViews = createLazyView<StudentSessionsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/sessions/studentSessions.mobile").then(m => ({
      default: m.StudentSessionsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/sessions/studentSessions.desktop").then(m => ({
      default: m.StudentSessionsDesktopView,
    }))
);

export function StudentSessionsContainer() {
  const viewModel = useStudentSessionsViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
