"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentCreditsViewModel,
  useStudentCreditsViewModel,
} from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";

const lazyViews = createLazyView<StudentCreditsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/credits/studentCredits.mobile").then(m => ({
      default: m.StudentCreditsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/credits/studentCredits.desktop").then(m => ({
      default: m.StudentCreditsDesktopView,
    }))
);

export function StudentCreditsContainer() {
  const viewModel = useStudentCreditsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { StudentCreditsViewModel };
