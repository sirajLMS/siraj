"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentProfileViewModel,
  type UseParentProfileViewModelProps,
  useParentProfileViewModel,
} from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";

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
  // NEW FOR PLAN v5: identity-hook (`useProfileFieldAccess` → reads
  // `useUserStore`) lifted to the Container so the mobile/desktop tier views
  // don't call hooks directly. Per specs.md §6.1 the Container owns all
  // identity plumbing; the tier view stays pure.
  const { canView } = useProfileFieldAccess({ scope: props.scope });
  const viewModel = useParentProfileViewModel({ ...props, canView });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
