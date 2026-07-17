// cspell:disable
"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherAvailabilityViewModel,
  type UseTeacherAvailabilityViewModelProps,
  useTeacherAvailabilityViewModel,
} from "@/frontend/common/views/dashboard/teachers/availability/useTeacherAvailabilityViewModel";

export type { TeacherAvailabilityViewModel, UseTeacherAvailabilityViewModelProps };

const lazyViews = createLazyView<TeacherAvailabilityViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/availability/teacherAvailabilityView.mobile").then(m => ({
      default: m.TeacherAvailabilityMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/availability/teacherAvailabilityView.desktop").then(m => ({
      default: m.TeacherAvailabilityDesktopView,
    }))
);

export function TeacherAvailabilityView(props: Readonly<UseTeacherAvailabilityViewModelProps>) {
  const viewModel = useTeacherAvailabilityViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
