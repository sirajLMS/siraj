"use client";

import { Stack } from "@mui/material";
import { PaymentMethodsManager } from "@/frontend/common/views/dashboard/profile/shared/payment-methods";
import type { PaymentMethodsTabVariantProps } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export type PaymentMethodsTabMobileViewProps = PaymentMethodsTabVariantProps;

export function PaymentMethodsTabMobileView({
  targetUserId,
  slot,
  canManage,
  title,
}: Readonly<PaymentMethodsTabMobileViewProps>) {
  return (
    <MobilePageContainer>
      <Stack spacing={3}>
        <MobilePageHeader title={title} />
        <PaymentMethodsManager targetUserId={targetUserId} slot={slot} canManage={canManage} />
      </Stack>
    </MobilePageContainer>
  );
}
