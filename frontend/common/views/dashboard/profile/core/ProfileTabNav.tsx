"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import {
  type ProfileTabNavProps,
  useProfileTabNavViewModel,
} from "@/frontend/common/views/dashboard/profile/core/useProfileTabNavViewModel";

export type { ProfileTabNavProps };

const lazyViews = createLazyView<ProfileTabNavVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/core/profileTabNav.mobile").then(m => ({
      default: m.ProfileTabNavMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/core/profileTabNav.desktop").then(m => ({
      default: m.ProfileTabNavDesktopView,
    }))
);

export function ProfileTabNav(props: Readonly<ProfileTabNavProps>) {
  const viewModel = useProfileTabNavViewModel(props);

  if (!viewModel) {
    return null;
  }

  const { labels, availableTabs, currentTab, onTabChange } = viewModel;

  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={{ labels, availableTabs, currentTab, onTabChange }}
    />
  );
}
