"use client";

import { PaymentMethodsManager } from "@/frontend/common/views/dashboard/profile/shared/payment-methods";
import type { PaymentMethodsTabVariantProps } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { DesktopPageContainer, DesktopPageHeader, DesktopPaymentMethodList } from "@/frontend/desktop/components/ui";

export type PaymentMethodsTabDesktopViewProps = PaymentMethodsTabVariantProps;

export function PaymentMethodsTabDesktopView({
  targetUserId,
  slot,
  canManage,
  title,
}: Readonly<PaymentMethodsTabDesktopViewProps>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={title} />
      <PaymentMethodsManager
        targetUserId={targetUserId}
        slot={slot}
        canManage={canManage}
        ListView={DesktopPaymentMethodList}
      />
    </DesktopPageContainer>
  );
}
