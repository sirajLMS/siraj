"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentProfileViewModel,
  type UseParentProfileViewModelProps,
  useParentProfileViewModel,
} from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";

export type { ParentProfileViewModel, UseParentProfileViewModelProps };

const lazyViews = createLazyView<ParentProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/parent/parentProfile.mobile").then(m => ({
      default: m.ParentProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/parent/parentProfile.desktop").then(m => ({
      default: m.ParentProfileDesktopView,
    }))
);

export function ParentProfileContainer(props: Readonly<UseParentProfileViewModelProps>) {
  const viewModel = useParentProfileViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
