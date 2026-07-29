"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useSessionConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/tabs/session/useSessionConfigTabViewModel";
import type { SessionConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";

const lazyViews = createLazyView<SessionConfigTabViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/session/sessionConfigTab.mobile").then(m => ({
      default: m.SessionConfigTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/session/sessionConfigTab.desktop").then(m => ({
      default: m.SessionConfigTabDesktopView,
    }))
);

export function SessionConfigTab() {
  const viewModel = useSessionConfigTabViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
