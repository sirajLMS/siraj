"use client";

import type { UserBillingProfileViewProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";

export type UserBillingProfileViewModel = UserBillingProfileViewProps;

export type UseUserBillingProfileViewModelProps = UserBillingProfileViewProps;

export function useUserBillingProfileViewModel(
  props: Readonly<UseUserBillingProfileViewModelProps>
): UserBillingProfileViewModel {
  return { ...props };
}
