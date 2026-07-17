"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useAppTranslation } from "@/shared/locale";

export type PaymentMethodsTabProps = {
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly slot: "payin" | "payout";
};

export type PaymentMethodsTabVariantProps = {
  readonly targetUserId: string;
  readonly slot: "payin" | "payout";
  readonly canManage: boolean;
  readonly title: string;
};

const lazyViews = createLazyView<PaymentMethodsTabVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/shared/payment-methods/paymentMethodsTab.mobile").then(m => ({
      default: m.PaymentMethodsTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/shared/payment-methods/paymentMethodsTab.desktop").then(m => ({
      default: m.PaymentMethodsTabDesktopView,
    }))
);

export function PaymentMethodsTab({ targetUserId, scope, slot }: Readonly<PaymentMethodsTabProps>) {
  const t = useAppTranslation().profileTranslations.base;
  const { user, hasPermission } = useUserStore();

  const canManage =
    scope === ProfileScope.Own ? user?.id === targetUserId : hasPermission(AppPermission.UserEditProfile);

  const variantProps: PaymentMethodsTabVariantProps = {
    targetUserId,
    slot,
    canManage,
    title: t.shell.tabs.paymentMethods,
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={variantProps} />;
}
