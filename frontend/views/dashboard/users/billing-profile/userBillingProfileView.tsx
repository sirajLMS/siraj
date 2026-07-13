"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type UserBillingProfileViewModel,
  type UseUserBillingProfileViewModelProps,
  useUserBillingProfileViewModel,
} from "@/frontend/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";

export type { UserBillingProfileViewModel };

const lazyViews = createLazyView<UserBillingProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/users/billing-profile/userBillingProfile.mobile").then(m => ({
      default: m.UserBillingProfileMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/users/billing-profile/desktop/userBillingProfile.desktop").then(m => ({
      default: m.UserBillingProfileDesktopView,
    }))
);

export function UserBillingProfileView(props: Readonly<UseUserBillingProfileViewModelProps>) {
  const viewModel = useUserBillingProfileViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
