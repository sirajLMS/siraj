"use client";

import { pickUserBillingSectionProps } from "@/frontend/common/views/dashboard/users/billing-profile/__shared__/userBillingProfileSharedProps";
import type { UserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { BillingSectionDesktop } from "@/frontend/desktop/views/dashboard/billing/components/__shared__/billingSectionShared.desktop";

export function UserBillingProfileDesktopView(viewModel: Readonly<UserBillingProfileViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={viewModel.labels.billingProfileTitle} subtitle={viewModel.labels.profileForUser} />
      <BillingSectionDesktop {...pickUserBillingSectionProps(viewModel)} />
    </DesktopPageContainer>
  );
}
