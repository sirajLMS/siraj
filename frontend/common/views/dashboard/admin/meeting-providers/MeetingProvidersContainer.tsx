"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type MeetingProvidersViewModel,
  type UseMeetingProvidersViewModelProps,
  useMeetingProvidersViewModel,
} from "@/frontend/common/views/dashboard/admin/meeting-providers/useMeetingProvidersViewModel";

const lazyViews = createLazyView<MeetingProvidersViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/meeting-providers/meetingProviders.mobile").then(m => ({
      default: m.MeetingProvidersMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/meeting-providers/meetingProviders.desktop").then(m => ({
      default: m.MeetingProvidersDesktopView,
    }))
);

export function MeetingProvidersView(props: Readonly<UseMeetingProvidersViewModelProps>) {
  const viewModel = useMeetingProvidersViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { MeetingProvidersViewModel, UseMeetingProvidersViewModelProps };
