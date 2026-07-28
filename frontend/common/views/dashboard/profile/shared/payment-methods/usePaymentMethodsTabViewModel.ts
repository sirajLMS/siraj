"use client";

import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { PaymentMethodsTabVariantProps } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { Translation, useAppTranslation } from "@/shared/locale";

export type UsePaymentMethodsTabViewModelProps = {
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly slot: PaymentMethodsTabVariantProps["slot"];
};

export function usePaymentMethodsTabViewModel(
  props: Readonly<UsePaymentMethodsTabViewModelProps>
): PaymentMethodsTabVariantProps {
  const { targetUserId, scope, slot } = props;
  const t = useAppTranslation(Translation.Profile.Base);
  const { user, hasPermission } = useUserStore();

  const canManage =
    scope === ProfileScope.Own ? user?.id === targetUserId : hasPermission(AppPermission.UserEditProfile);

  return {
    targetUserId,
    slot,
    canManage,
    title: t.shell.tabs.paymentMethods,
  };
}
