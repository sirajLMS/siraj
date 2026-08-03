"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useMeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const lazyViews = createLazyView<MeetingIntegrationsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.mobile").then(
      m => ({
        default: m.MeetingIntegrationsTabMobileView,
      })
    ),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.desktop").then(
      m => ({
        default: m.MeetingIntegrationsTabDesktopView,
      })
    )
);

export function MeetingIntegrationsTab() {
  const viewModel = useMeetingIntegrationsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
