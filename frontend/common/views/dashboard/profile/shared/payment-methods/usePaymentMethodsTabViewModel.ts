"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { PaymentMethodsTabVariantProps } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { ProfileScope } from "@/shared/constants/profile.enum";
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
    scope === ProfileScope.OWN
      ? user?.id === targetUserId
      : hasPermission(AppPermission.ProfilePaymentMethodsEditOther);

  return {
    targetUserId,
    slot,
    canManage,
    title: t.shell.tabs.paymentMethods,
  };
}
