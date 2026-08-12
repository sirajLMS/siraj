"use client";

import { useUserBillingSectionProps } from "@/frontend/common/views/dashboard/users/billing-profile/__shared__/userBillingProfileSharedProps";
import type { UserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";
import { BillingSectionMobile } from "@/frontend/mobile/views/dashboard/billing/components/__shared__/billingSectionShared.mobile";

export function UserBillingProfileMobileView(viewModel: Readonly<UserBillingProfileViewModel>) {
  return (
    <BillingSectionMobile
      {...useUserBillingSectionProps(viewModel)}
      pageTitle={viewModel.labels.billingProfileTitle}
      pageSubtitle={viewModel.labels.profileForUser}
      metrics={viewModel.metrics}
    />
  );
}
