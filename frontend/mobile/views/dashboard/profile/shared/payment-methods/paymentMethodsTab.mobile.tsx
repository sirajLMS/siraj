"use client";

import { PaymentMethodsManager } from "@/frontend/common/views/dashboard/profile/shared/payment-methods";
import type { PaymentMethodsTabVariantProps } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { MobilePageContainer, MobilePageHeader, MobilePaymentMethodList } from "@/frontend/mobile/components/ui";

export type PaymentMethodsTabMobileViewProps = PaymentMethodsTabVariantProps;

export function PaymentMethodsTabMobileView({
  targetUserId,
  slot,
  canManage,
  title,
}: Readonly<PaymentMethodsTabMobileViewProps>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={title} />
      <PaymentMethodsManager
        targetUserId={targetUserId}
        slot={slot}
        canManage={canManage}
        ListView={MobilePaymentMethodList}
      />
    </MobilePageContainer>
  );
}
