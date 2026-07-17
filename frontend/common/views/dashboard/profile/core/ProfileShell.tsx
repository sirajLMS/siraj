"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ProfileShellProps } from "@/frontend/common/views/dashboard/profile/core/profileShellTypes";

export type { ProfileShellProps };

const lazyViews = createLazyView<ProfileShellProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/core/profileShell.mobile").then(m => ({
      default: m.ProfileShellMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/core/profileShell.desktop").then(m => ({
      default: m.ProfileShellDesktopView,
    }))
);

export function ProfileShell(props: Readonly<ProfileShellProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
