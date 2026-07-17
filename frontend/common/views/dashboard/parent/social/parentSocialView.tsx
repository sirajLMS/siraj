"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentSocialViewModel,
  type UseParentSocialViewModelProps,
  useParentSocialViewModel,
} from "@/frontend/common/views/dashboard/parent/social/useParentSocialViewModel";

export type { ParentSocialViewModel };

const lazyViews = createLazyView<ParentSocialViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/parent/social/parentSocial.mobile").then(m => ({
      default: m.ParentSocialMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parent/social/parentSocial.desktop").then(m => ({
      default: m.ParentSocialDesktopView,
    }))
);

export function ParentSocialView(props: Readonly<UseParentSocialViewModelProps>) {
  const viewModel = useParentSocialViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
