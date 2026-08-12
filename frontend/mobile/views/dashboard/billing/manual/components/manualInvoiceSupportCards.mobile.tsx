"use client";

import { ManualInvoiceSupportCardsShared } from "@/frontend/common/views/dashboard/billing/manual/components/__shared__/manualInvoiceSupportCardsShared";
import type { ManualInvoiceSupportCardsProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceSupportCards.types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

export function ManualInvoiceSupportCardsMobile(props: Readonly<ManualInvoiceSupportCardsProps>) {
  return <ManualInvoiceSupportCardsShared {...props} config={{ Card: MobileBaseCard }} />;
}
