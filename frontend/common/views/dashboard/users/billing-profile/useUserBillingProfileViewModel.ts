"use client";

import type { UserBillingProfileViewProps } from "@/frontend/common/views/dashboard/users/billing-profile/types/userBillingProfile.types";

export type UserBillingProfileViewModel = UserBillingProfileViewProps;

export type UseUserBillingProfileViewModelProps = UserBillingProfileViewProps;

export function useUserBillingProfileViewModel(
  props: Readonly<UseUserBillingProfileViewModelProps>
): UserBillingProfileViewModel {
  return { ...props };
}
