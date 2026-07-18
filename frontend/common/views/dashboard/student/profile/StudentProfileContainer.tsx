"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentProfileViewModel,
  type UseStudentProfileViewModelProps,
  useStudentProfileViewModel,
} from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";

export type { StudentProfileViewModel, UseStudentProfileViewModelProps };

const lazyViews = createLazyView<StudentProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/profile/studentProfile.mobile").then(m => ({
      default: m.StudentProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/profile/studentProfile.desktop").then(m => ({
      default: m.StudentProfileDesktopView,
    }))
);

export function StudentProfileContainer(props: Readonly<UseStudentProfileViewModelProps>) {
  const viewModel = useStudentProfileViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
