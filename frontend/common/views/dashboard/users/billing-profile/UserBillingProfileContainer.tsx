"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type UserBillingProfileViewModel,
  type UseUserBillingProfileViewModelProps,
  useUserBillingProfileViewModel,
} from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";

const lazyViews = createLazyView<UserBillingProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/users/billing-profile/userBillingProfile.mobile").then(m => ({
      default: m.UserBillingProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/users/billing-profile/userBillingProfile.desktop").then(m => ({
      default: m.UserBillingProfileDesktopView,
    }))
);

export function UserBillingProfileContainer(props: Readonly<UseUserBillingProfileViewModelProps>) {
  const viewModel = useUserBillingProfileViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { UserBillingProfileViewModel, UseUserBillingProfileViewModelProps };
