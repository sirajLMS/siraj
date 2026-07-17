"use client";

import { Stack } from "@mui/material";
import { PaymentMethodsManager } from "@/frontend/common/views/dashboard/profile/shared/payment-methods";
import type { PaymentMethodsTabVariantProps } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

export type PaymentMethodsTabDesktopViewProps = PaymentMethodsTabVariantProps;

export function PaymentMethodsTabDesktopView({
  targetUserId,
  slot,
  canManage,
  title,
}: Readonly<PaymentMethodsTabDesktopViewProps>) {
  return (
    <DesktopPageContainer>
      <Stack spacing={3}>
        <DesktopPageHeader title={title} />
        <PaymentMethodsManager targetUserId={targetUserId} slot={slot} canManage={canManage} />
      </Stack>
    </DesktopPageContainer>
  );
}
