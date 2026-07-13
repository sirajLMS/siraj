"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentCreditsViewModel,
  type UseStudentCreditsViewModelProps,
  useStudentCreditsViewModel,
} from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";

export type { StudentCreditsViewModel };

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

export function StudentCreditsView(props: Readonly<UseStudentCreditsViewModelProps>) {
  const viewModel = useStudentCreditsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
