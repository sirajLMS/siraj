"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
  // NEW FOR PLAN v5: the `<RequirePermission>` wrapper that previously lived
  // inside the tier view files (mobile + desktop) was lifted here per
  // specs.md §3 N3 + §6.1 — permission gating lives in the common Container.
  // The tier files no longer import `RequirePermission` or `useUserStore`.
  return (
    <RequirePermission permissions={[AppPermission.MeetingProvidersManageCatalog]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { MeetingProvidersViewModel, UseMeetingProvidersViewModelProps };
