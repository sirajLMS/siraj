"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherProfileViewModel,
  type UseTeacherProfileViewModelProps,
  useTeacherProfileViewModel,
} from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";

const lazyViews = createLazyView<TeacherProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/teacher/teacherProfile.mobile").then(m => ({
      default: m.TeacherProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/teacher/teacherProfile.desktop").then(m => ({
      default: m.TeacherProfileDesktopView,
    }))
);

export function TeacherProfileContainer(props: Readonly<UseTeacherProfileViewModelProps>) {
  const viewModel = useTeacherProfileViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { TeacherProfileViewModel, UseTeacherProfileViewModelProps };
