"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";

type ProfileSkeletonViewProps = Record<string, never>;

const lazyViews = createLazyView<ProfileSkeletonViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/core/profileSkeleton.mobile").then(m => ({
      default: m.ProfileSkeletonMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/core/profileSkeleton.desktop").then(m => ({
      default: m.ProfileSkeletonDesktopView,
    }))
);

export function ProfileSkeleton() {
  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={{} as ProfileSkeletonViewProps}
    />
  );
}
