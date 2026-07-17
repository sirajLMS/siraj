"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherOwnProfileViewModel,
  type UseTeacherOwnProfileViewModelProps,
  useTeacherOwnProfileViewModel,
} from "@/frontend/common/views/dashboard/teachers/own-profile/useTeacherOwnProfileViewModel";

const lazyViews = createLazyView<TeacherOwnProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/own-profile/teacherOwnProfileView.mobile").then(m => ({
      default: m.TeacherOwnProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/own-profile/teacherOwnProfileView.desktop").then(m => ({
      default: m.TeacherOwnProfileDesktopView,
    }))
);

export function TeacherOwnProfileView(props: Readonly<UseTeacherOwnProfileViewModelProps>) {
  const viewModel = useTeacherOwnProfileViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export default TeacherOwnProfileView;
export type { TeacherOwnProfileViewModel, UseTeacherOwnProfileViewModelProps };
