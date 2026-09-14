"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentProfileViewModel,
  type UseParentProfileViewModelProps,
  useParentProfileViewModel,
} from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";

export type { UseParentProfileViewModelProps };

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
  // The identity hook (`useProfileFieldAccess`, backed by `useUserStore`) is
  // lifted into the Container so mobile/desktop tier views stay hook-free:
  // the Container owns all identity plumbing and passes `canView` down to
  // the ViewModel.
  const { canView } = useProfileFieldAccess({ scope: props.scope });
  const viewModel = useParentProfileViewModel({ ...props, canView });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
