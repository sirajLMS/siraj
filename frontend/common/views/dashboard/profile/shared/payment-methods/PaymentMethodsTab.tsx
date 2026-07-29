"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { usePaymentMethodsTabViewModel } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/usePaymentMethodsTabViewModel";

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
  const variantProps = usePaymentMethodsTabViewModel({ targetUserId, scope, slot });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={variantProps} />;
}
