"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StaffProfileViewModel,
  type UseStaffProfileViewModelProps,
  useStaffProfileViewModel,
} from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";

export type { StaffProfileViewModel, UseStaffProfileViewModelProps };

const lazyViews = createLazyView<StaffProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/staff/staffProfile.mobile").then(m => ({
      default: m.StaffProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/staff/staffProfile.desktop").then(m => ({
      default: m.StaffProfileDesktopView,
    }))
);

export function StaffProfileContainer(props: Readonly<UseStaffProfileViewModelProps>) {
  const viewModel = useStaffProfileViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
