"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { MeetingProvidersViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";

const lazyViews = createLazyView<MeetingProvidersViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/meeting-providers/meetingProviders.mobile").then(m => ({
      default: m.MeetingProvidersMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/meeting-providers/meetingProviders.desktop").then(m => ({
      default: m.MeetingProvidersDesktopView,
    }))
);

export function MeetingProvidersView(props: Readonly<MeetingProvidersViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
